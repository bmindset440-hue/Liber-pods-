
import { AndroidFile } from './types';

export const ANDROID_PROJECT_CODE: AndroidFile[] = [
  {
    path: 'app/src/main/AndroidManifest.xml',
    language: 'xml',
    description: 'Manifest configuration with minimal permissions and the essential BroadcastReceiver/Service declarations.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.LiberPods">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.LiberPods">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <receiver
            android:name=".receiver.BluetoothEventReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.bluetooth.device.action.ACL_CONNECTED" />
            </intent-filter>
        </receiver>

        <service
            android:name=".service.OverlayPopupService"
            android:exported="false" />

    </application>
</manifest>`
  },
  {
    path: 'app/src/main/java/com/liberpods/storage/SettingsStore.kt',
    language: 'kotlin',
    description: 'DataStore implementation for persistent user preferences (MAC, Theme, Media URIs).',
    content: `package com.liberpods.storage

import android.content.Context
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "liberpods_settings")

data class UserSettings(
    val selectedMac: String?,
    val popupStyle: String,
    val bgUri: String?,
    val blurLevel: Float,
    val scaleFill: Boolean,
    val darkOverlay: Boolean,
    val ultraPowerMode: Boolean
)

class SettingsStore(private val context: Context) {
    companion object {
        val MAC_ADDRESS = stringPreferenceKey("mac_address")
        val POPUP_STYLE = stringPreferenceKey("popup_style")
        val BG_URI = stringPreferenceKey("bg_uri")
        val BLUR_LEVEL = floatPreferenceKey("blur_level")
        val SCALE_FILL = booleanPreferenceKey("scale_fill")
        val DARK_OVERLAY = booleanPreferenceKey("dark_overlay")
        val ULTRA_POWER = booleanPreferenceKey("ultra_power")
    }

    val settingsFlow: Flow<UserSettings> = context.dataStore.data.map { prefs ->
        UserSettings(
            selectedMac = prefs[MAC_ADDRESS],
            popupStyle = prefs[POPUP_STYLE] ?: "Minimal",
            bgUri = prefs[BG_URI],
            blurLevel = prefs[BLUR_LEVEL] ?: 0f,
            scaleFill = prefs[SCALE_FILL] ?: true,
            darkOverlay = prefs[DARK_OVERLAY] ?: false,
            ultraPowerMode = prefs[ULTRA_POWER] ?: false
        )
    }

    suspend fun updateDevice(mac: String) {
        context.dataStore.edit { it[MAC_ADDRESS] = mac }
    }

    suspend fun updateStyle(style: String) {
        context.dataStore.edit { it[POPUP_STYLE] = style }
    }

    suspend fun updateCustomization(bgUri: String?, blur: Float, fill: Boolean, dark: Boolean) {
        context.dataStore.edit { 
            it[BG_URI] = bgUri ?: ""
            it[BLUR_LEVEL] = blur
            it[SCALE_FILL] = fill
            it[DARK_OVERLAY] = dark
        }
    }

    suspend fun updateUltraPower(enabled: Boolean) {
        context.dataStore.edit { it[ULTRA_POWER] = enabled }
    }
}`
  },
  {
    path: 'app/src/main/java/com/liberpods/receiver/BluetoothEventReceiver.kt',
    language: 'kotlin',
    description: 'The event-driven entry point. Listens for Bluetooth connections and triggers the service only if conditions match.',
    content: `package com.liberpods.receiver

import android.bluetooth.BluetoothDevice
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.PowerManager
import com.liberpods.service.OverlayPopupService
import com.liberpods.storage.SettingsStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class BluetoothEventReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != BluetoothDevice.ACTION_ACL_CONNECTED) return

        val device: BluetoothDevice? = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE)
        val deviceMac = device?.address ?: return
        val deviceName = device?.name ?: "Earbuds"

        val store = SettingsStore(context)
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager

        CoroutineScope(Dispatchers.IO).launch {
            val settings = store.settingsFlow.first()
            
            // Condition 1: Must be our selected device
            if (settings.selectedMac != deviceMac) return@launch

            // Condition 2: Ultra Power Mode (Ignore if screen is off)
            if (settings.ultraPowerMode && !powerManager.isInteractive) return@launch

            // Start short-lived overlay service
            val serviceIntent = Intent(context, OverlayPopupService::class.java).apply {
                putExtra("device_name", deviceName)
            }
            context.startService(serviceIntent)
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/liberpods/service/OverlayPopupService.kt',
    language: 'kotlin',
    description: 'Short-lived service managing the overlay popup with synchronized exit animations.',
    content: `package com.liberpods.service

import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.IBinder
import android.view.Gravity
import android.view.WindowManager
import androidx.compose.ui.platform.ComposeView
import androidx.lifecycle.*
import androidx.savedstate.SavedStateRegistry
import androidx.savedstate.SavedStateRegistryController
import androidx.savedstate.SavedStateRegistryOwner
import androidx.savedstate.setViewTreeSavedStateRegistryOwner
import com.liberpods.ui.PopupContent

class OverlayPopupService : Service(), LifecycleOwner, ViewModelStoreOwner, SavedStateRegistryOwner {

    private lateinit var windowManager: WindowManager
    private var composeView: ComposeView? = null
    
    private val lifecycleRegistry = LifecycleRegistry(this)
    override val lifecycle: Lifecycle get() = lifecycleRegistry
    override val viewModelStore = ViewModelStore()
    private val savedStateRegistryController = SavedStateRegistryController.create(this)
    override val savedStateRegistry: SavedStateRegistry get() = savedStateRegistryController.savedStateRegistry

    override fun onCreate() {
        super.onCreate()
        savedStateRegistryController.performRestore(null)
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_CREATE)
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val deviceName = intent?.getStringExtra("device_name") ?: "Earbuds"
        showPopup(deviceName)
        return START_NOT_STICKY
    }

    private fun showPopup(deviceName: String) {
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.BOTTOM
            // System-level window animations (Slide/Fade)
            windowAnimations = android.R.style.Animation_Toast
        }

        composeView = ComposeView(this).apply {
            setViewTreeLifecycleOwner(this@OverlayPopupService)
            setViewTreeViewModelStoreOwner(this@OverlayPopupService)
            setViewTreeSavedStateRegistryOwner(this@OverlayPopupService)
            setContent {
                // Event-driven removal: PopupContent tells the service when its animation is finished
                PopupContent(deviceName) {
                    stopSelf()
                }
            }
        }

        windowManager.addView(composeView, params)
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_START)
    }

    override fun onDestroy() {
        super.onDestroy()
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_DESTROY)
        // Clean up the view immediately upon service destruction
        composeView?.let { 
            if (it.parent != null) {
                windowManager.removeView(it)
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null
}`
  },
  {
    path: 'app/src/main/java/com/liberpods/ui/PopupContent.kt',
    language: 'kotlin',
    description: 'Visual logic for the popup with coordinated exit animations and service dismissal callback.',
    content: `package com.liberpods.ui

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.Icon
import androidx.compose.material.Text
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bluetooth
import androidx.compose.material.icons.filled.BluetoothSearching
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.painter.ColorPainter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.CachePolicy
import coil.request.ImageRequest
import com.airbnb.android.lottie.compose.*
import com.liberpods.storage.SettingsStore
import com.liberpods.R
import kotlinx.coroutines.delay

@Composable
fun PopupContent(deviceName: String, onDismissed: () -> Unit) {
    val context = LocalContext.current
    val store = remember { SettingsStore(context) }
    val settings by store.settingsFlow.collectAsState(initial = null)
    
    var isVisible by remember { mutableStateOf(false) }
    var isConnected by remember { mutableStateOf(false) }
    var mediaLoadFailed by remember { mutableStateOf(false) }
    
    LaunchedEffect(Unit) {
        isVisible = true
        delay(600) // Search simulation
        isConnected = true
        delay(3200) // Stay visible
        isVisible = false // Trigger exit animation
        delay(600) // Wait for exit animation to finish
        onDismissed() // Signal service to stop
    }

    AnimatedVisibility(
        visible = isVisible,
        enter = slideInVertically(initialOffsetY = { it }) + fadeIn(animationSpec = tween(400)),
        exit = fadeOut(animationSpec = tween(500)) + slideOutVertically(targetOffsetY = { it }, animationSpec = tween(500))
    ) {
        val currentStyle = settings?.popupStyle ?: "Minimal"
        val isAmoled = currentStyle == "AMOLED"
        val isCustom = currentStyle == "Custom"

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .height(260.dp)
                .clip(RoundedCornerShape(32.dp))
                .background(if (isAmoled) Color.Black else Color.White),
            contentAlignment = Alignment.Center
        ) {
            // 1. LOTTIE PRESETS
            if (!isCustom && currentStyle != "Minimal") {
                val lottieRes = when(currentStyle) {
                    "Glass" -> R.raw.glass_theme
                    "AMOLED" -> R.raw.amoled_theme
                    "RGB" -> R.raw.rgb_theme
                    else -> null
                }
                lottieRes?.let { res ->
                    val composition by rememberLottieComposition(LottieCompositionSpec.RawRes(res))
                    val progress by animateLottieCompositionAsState(composition, iterations = LottieConstants.IterateForever, speed = 0.5f)
                    LottieAnimation(composition, { progress }, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                }
            }

            // 2. CUSTOM MEDIA
            if (isCustom && !mediaLoadFailed) {
                settings?.bgUri?.let { uri ->
                    AsyncImage(
                        model = ImageRequest.Builder(context)
                            .data(uri)
                            .crossfade(true)
                            .diskCachePolicy(CachePolicy.ENABLED)
                            .memoryCachePolicy(CachePolicy.DISABLED)
                            .build(),
                        placeholder = ColorPainter(Color.LightGray.copy(alpha = 0.1f)),
                        contentDescription = null,
                        contentScale = if (settings?.scaleFill == true) ContentScale.Crop else ContentScale.Fit,
                        modifier = Modifier.fillMaxSize().blur(settings?.blurLevel?.dp ?: 0.dp),
                        onError = { mediaLoadFailed = true }
                    )
                }
            }

            // 3. OVERLAY FOR TEXT READABILITY
            val hasDarkOverlay = (isCustom && settings?.darkOverlay == true) || currentStyle == "RGB"
            if (hasDarkOverlay) {
                Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.4f)))
            }

            // 4. CONTENT
            val infiniteTransition = rememberInfiniteTransition()
            val floatAnim by infiniteTransition.animateFloat(
                initialValue = 0f, targetValue = -10f,
                animationSpec = infiniteRepeatable(tween(2000, easing = LinearOutSlowInEasing), RepeatMode.Reverse)
            )

            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                val textColor = if (hasDarkOverlay || isAmoled) Color.White else Color.Black
                
                Icon(
                    imageVector = if (isConnected) Icons.Default.Bluetooth else Icons.Default.BluetoothSearching,
                    contentDescription = null,
                    tint = if (isConnected) Color(0xFF3B82F6) else Color.LightGray,
                    modifier = Modifier.size(80.dp).offset(y = floatAnim.dp)
                )

                Spacer(Modifier.height(16.dp))

                Text(
                    text = if (isConnected) deviceName else "Connecting...",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = textColor
                )
                
                if (isConnected) {
                    Text(
                        text = "90% BATTERY",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = textColor.copy(alpha = 0.6f),
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/liberpods/MainActivity.kt',
    language: 'kotlin',
    description: 'The management interface for selecting earbuds and configuring themes.',
    content: `package com.liberpods

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import com.liberpods.storage.SettingsStore
import com.liberpods.ui.MainAppContainer
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    private lateinit var store: SettingsStore
    private val bluetoothAdapter: BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter()

    private val overlayPermissionLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) {
        // Handle permission result if needed
    }

    private val imagePicker = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        uri?.let {
            contentResolver.takePersistableUriPermission(it, Intent.FLAG_GRANT_READ_URI_PERMISSION)
            saveMedia(it.toString())
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        store = SettingsStore(this)

        // Check overlay permission
        if (!Settings.canDrawOverlays(this)) {
            val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName"))
            overlayPermissionLauncher.launch(intent)
        }

        setContent {
            val bondedDevices = bluetoothAdapter?.bondedDevices?.toList() ?: emptyList()
            MainAppContainer(
                store = store,
                bondedDevices = bondedDevices,
                onPickImage = { imagePicker.launch(arrayOf("image/*", "video/*")) }
            )
        }
    }

    private fun saveMedia(uri: String) {
        CoroutineScope(Dispatchers.IO).launch {
            store.updateStyle("Custom")
            store.updateCustomization(uri, 0f, true, false)
        }
    }
}`
  }
];
