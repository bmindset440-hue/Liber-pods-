
import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Bluetooth, 
  Settings, 
  Code, 
  CheckCircle2, 
  Zap, 
  Palette, 
  ChevronRight,
  Monitor,
  Cpu,
  Battery,
  Layers,
  FileCode2,
  Copy,
  Info,
  Loader2,
  Image as ImageIcon,
  Sliders,
  Type,
  Video,
  Sparkles
} from 'lucide-react';
import { ANDROID_PROJECT_CODE } from './constants';
import { Device, PopupStyle, AppState } from './types';

const MOCK_BONDED_DEVICES: Device[] = [
  { name: 'Sony WH-1000XM4', mac: 'BC:A1:22:90:FD:11' },
  { name: 'Samsung Buds Pro', mac: '34:D2:C1:AA:88:BB' },
  { name: 'OnePlus Buds Z2', mac: '90:EE:12:33:44:55' },
  { name: 'Boat Airdopes 441', mac: '11:22:33:44:55:66' },
  { name: 'Noise Buds VS102', mac: 'AA:BB:CC:DD:EE:FF' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'emulator' | 'code'>('emulator');
  const [step, setStep] = useState<number>(1);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [popupStyle, setPopupStyle] = useState<PopupStyle>('Minimal');
  
  // Customization States
  const [customBg, setCustomBg] = useState<string | null>(null);
  const [blurLevel, setBlurLevel] = useState(0);
  const [isScaleFill, setIsScaleFill] = useState(true);
  const [isDarkOverlay, setIsDarkOverlay] = useState(false);

  const [isApplying, setIsApplying] = useState(false);
  const [popupState, setPopupState] = useState<'hidden' | 'showing' | 'hiding'>('hidden');
  const [popupContentState, setPopupContentState] = useState<'searching' | 'connected'>('searching');
  const [ultraPowerMode, setUltraPowerMode] = useState(false);

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      setStep(4);
    }, 2500);
  };

  const triggerSimulation = () => {
    if (popupState !== 'hidden') return;
    setPopupState('showing');
    setPopupContentState('searching');
    setTimeout(() => setPopupContentState('connected'), 800);
    setTimeout(() => {
      setPopupState('hiding');
      setTimeout(() => setPopupState('hidden'), 400);
    }, 3800);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
      <div className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
              <Smartphone size={24} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">LiberPods</h1>
          </div>
          <p className="text-slate-500 text-sm">Earbud Popup Utility</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('emulator')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'emulator' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Monitor size={20} /> App Simulation
          </button>
          <button onClick={() => setActiveTab('code')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'code' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Code size={20} /> Production Code
          </button>
        </nav>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-amber-500 fill-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ultra Power Mode</span>
            </div>
            <button onClick={() => setUltraPowerMode(!ultraPowerMode)} className={`w-full py-2 px-3 rounded-xl text-[10px] font-black transition-all ${ultraPowerMode ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-slate-100 text-slate-600'}`}>
              {ultraPowerMode ? 'ENABLED (OS Filter Active)' : 'DISABLED'}
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        {activeTab === 'emulator' ? (
          <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-12 items-start">
            <div className="w-full max-w-[340px] shrink-0 mx-auto lg:mx-0">
              <div className="relative aspect-[9/19] bg-slate-900 rounded-[3.5rem] border-[10px] border-slate-800 shadow-2xl overflow-hidden ring-4 ring-slate-900/10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-7 bg-slate-800 rounded-b-3xl z-20"></div>
                <div className="absolute inset-0 bg-white flex flex-col p-6 pt-12 overflow-y-auto">
                  <header className="flex items-center justify-between mb-8 px-2">
                    <h2 className="text-xl font-black text-slate-900 tracking-tighter italic">LiberPods</h2>
                    <Settings size={20} className="text-slate-300" />
                  </header>

                  <div className="flex-1">
                    {step === 1 && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 px-2">
                        <div className="bg-blue-50 p-6 rounded-[2.5rem] mb-8 flex flex-col items-center border border-blue-100/50">
                          <Bluetooth size={48} className="text-blue-500 mb-3" />
                          <p className="text-xs font-bold text-blue-800 text-center">Bonded Bluetooth Devices</p>
                        </div>
                        <div className="space-y-3">
                          {MOCK_BONDED_DEVICES.map((d) => (
                            <button key={d.mac} onClick={() => setSelectedDevice(d)} className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${selectedDevice?.mac === d.mac ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-100 hover:border-slate-300'}`}>
                              <span className="font-bold text-slate-800 text-xs tracking-tight">{d.name}</span>
                              {selectedDevice?.mac === d.mac && <CheckCircle2 size={16} className="text-blue-600" />}
                            </button>
                          ))}
                        </div>
                        <button disabled={!selectedDevice} onClick={() => setStep(2)} className="w-full mt-10 bg-slate-900 text-white py-4 rounded-2xl font-black text-sm shadow-xl disabled:opacity-30 transition-all active:scale-95">CONTINUE</button>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6 px-2">
                        <div>
                          <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-5 flex items-center gap-2">
                             <Palette size={16} className="text-blue-500" /> Theme Selection
                          </h3>
                          <div className="grid grid-cols-2 gap-3 mb-6">
                            {['Minimal', 'Glass', 'AMOLED', 'RGB', 'Custom'].map((s) => (
                              <button key={s} onClick={() => setPopupStyle(s as PopupStyle)} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${popupStyle === s ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-100 hover:bg-slate-50'}`}>
                                <span className="text-[10px] font-black uppercase tracking-wider">{s}</span>
                              </button>
                            ))}
                          </div>

                          <div className="bg-slate-50 p-5 rounded-[2rem] space-y-5 border border-slate-200/50 shadow-inner">
                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Settings</h4>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <button 
                                onClick={() => setCustomBg('https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&w=400&q=80')} 
                                className={`py-2.5 rounded-xl text-[10px] font-black transition-all border flex items-center justify-center gap-2 ${customBg ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-600'}`}
                              >
                                <ImageIcon size={12} /> Image
                              </button>
                              <button className="py-2.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-400 opacity-50">
                                <Video size={12} /> Video
                              </button>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-[9px] font-black text-slate-500 uppercase">Blur Effect ({blurLevel}px)</label>
                              </div>
                              <input type="range" min="0" max="25" value={blurLevel} onChange={(e) => setBlurLevel(parseInt(e.target.value))} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black text-slate-500 uppercase">Dark Overlay</span>
                              <div onClick={() => setIsDarkOverlay(!isDarkOverlay)} className={`w-9 h-5 rounded-full p-1 transition-all cursor-pointer ${isDarkOverlay ? 'bg-blue-600 shadow-sm' : 'bg-slate-300'}`}>
                                <div className={`w-3 h-3 bg-white rounded-full transition-all ${isDarkOverlay ? 'translate-x-4' : 'translate-x-0'}`}></div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black text-slate-500 uppercase">Aspect Fill</span>
                              <div onClick={() => setIsScaleFill(!isScaleFill)} className={`w-9 h-5 rounded-full p-1 transition-all cursor-pointer ${isScaleFill ? 'bg-blue-600 shadow-sm' : 'bg-slate-300'}`}>
                                <div className={`w-3 h-3 bg-white rounded-full transition-all ${isScaleFill ? 'translate-x-4' : 'translate-x-0'}`}></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button onClick={handleApply} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-200 flex items-center justify-center gap-3 transition-all active:scale-95">
                          {isApplying ? <Loader2 className="animate-spin" size={18} /> : <> <Sparkles size={18} /> APPLY SETUP </>}
                        </button>
                      </div>
                    )}

                    {step === 4 && (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-10 animate-in zoom-in-95 duration-700 px-4">
                        <div className="w-20 h-20 bg-green-50 rounded-[2.5rem] flex items-center justify-center mb-8 border border-green-100 shadow-lg shadow-green-50">
                           <CheckCircle2 size={40} className="text-green-600" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Active Listener</h3>
                        <p className="text-slate-400 text-[11px] mt-2 mb-10 leading-relaxed uppercase tracking-widest font-bold">Passive event-receiver armed for<br/><span className="text-blue-600">{selectedDevice?.name}</span></p>
                        <button onClick={triggerSimulation} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] text-xs font-black shadow-2xl active:scale-95 transition-all tracking-[0.1em]">SIMULATE CONNECTION</button>
                        <button onClick={() => { setStep(2); }} className="mt-8 text-slate-300 text-[10px] font-black uppercase tracking-widest hover:text-slate-500 transition-colors">Edit Personalization</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* EMULATED POPUP OVERLAY */}
                {popupState !== 'hidden' && (
                  <div className={`absolute inset-x-0 bottom-4 px-4 z-50 ${popupState === 'showing' ? 'popup-spring-in' : 'popup-fade-out'}`}>
                    <div className={`p-6 rounded-[3rem] shadow-2xl flex flex-col items-center border overflow-hidden relative transition-all duration-700 min-h-[16rem] ${
                      popupStyle === 'Minimal' ? 'bg-white border-slate-100' :
                      popupStyle === 'Glass' ? 'bg-white/80 backdrop-blur-2xl border-white/50' :
                      popupStyle === 'AMOLED' ? 'bg-black border-neutral-800 text-white' :
                      popupStyle === 'RGB' ? 'bg-slate-900 border-indigo-500/30' :
                      'bg-white'
                    }`}>
                      
                      {/* Lottie/Preset Sub Animation logic emulation */}
                      {popupStyle === 'RGB' && <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 animate-pulse duration-[4000ms]"></div>}
                      {popupStyle === 'Glass' && <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-white/30 animate-pulse"></div>}

                      {/* Custom BG Rendering */}
                      {(popupStyle === 'Custom' || customBg) && customBg && (
                        <img 
                          src={customBg} 
                          className={`absolute inset-0 w-full h-full ${isScaleFill ? 'object-cover' : 'object-contain'}`} 
                          style={{ filter: `blur(${blurLevel}px)` }} 
                        />
                      )}
                      
                      {/* Dark Overlay Rendering */}
                      {(isDarkOverlay || popupStyle === 'RGB' || popupStyle === 'AMOLED') && (
                        <div className={`absolute inset-0 z-[1] ${popupStyle === 'AMOLED' ? 'bg-black/20' : 'bg-black/40'}`}></div>
                      )}

                      <div className="relative z-10 w-full flex flex-col items-center">
                        <div className="w-24 h-24 mb-5 relative flex items-center justify-center">
                           <div className={`absolute w-16 h-16 rounded-full animate-pulse-ring ${popupContentState === 'connected' ? 'bg-blue-500/30' : 'bg-slate-400/30'}`}></div>
                           <div className="relative z-10 animate-float">
                              <Bluetooth size={72} strokeWidth={2.5} className={`${popupContentState === 'connected' ? 'text-blue-500 shadow-blue-500/50' : 'text-slate-300'} ${(popupStyle === 'AMOLED' || isDarkOverlay || popupStyle === 'RGB') ? 'text-white' : ''} transition-all duration-700`} />
                           </div>
                        </div>
                        
                        <div className={`text-center ${ (popupStyle === 'AMOLED' || isDarkOverlay || popupStyle === 'RGB') ? 'text-white' : 'text-slate-900'}`}>
                          {popupContentState === 'searching' ? (
                            <div className="animate-pulse">
                               <h4 className="font-black text-sm uppercase tracking-widest opacity-40 italic">Syncing...</h4>
                            </div>
                          ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-1000">
                              <h4 className="font-black text-2xl tracking-tighter mb-1 italic">{selectedDevice?.name || 'My Buds'}</h4>
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 flex items-center justify-center gap-2">
                                <Battery size={12} className="text-green-500" /> ACTIVE 95%
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* DOCUMENTATION AREA */}
            <div className="flex-1 space-y-10">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic mb-4">Pure Architecture</h2>
                <p className="text-slate-500 leading-relaxed font-medium">LiberPods is not an app; it is a system extension. Designed for 0.0% idle impact using OS-native broadcast filtering.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card p-8 rounded-[3rem] border-slate-200/50 shadow-xl shadow-slate-100/50">
                  <Cpu className="text-blue-600 mb-6" size={32} />
                  <h3 className="font-black text-slate-900 mb-3 tracking-tight">Loop-Free UI</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">Compose animations and Lottie compositions are only active while the popup overlay exists. CPU yields immediately upon dismissal.</p>
                </div>
                <div className="glass-card p-8 rounded-[3rem] border-slate-200/50 shadow-xl shadow-slate-100/50">
                  <Battery className="text-emerald-600 mb-6" size={32} />
                  <h3 className="font-black text-slate-900 mb-3 tracking-tight">Passive I/O</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">No scanning. No polling. The app registers a high-priority system listener that triggers only on ACL connection events.</p>
                </div>
              </div>
              
              <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl shadow-blue-900/10">
                <h3 className="text-xl font-black mb-8 flex items-center gap-3"><Zap size={24} className="text-blue-400 fill-blue-400" /> Event-Driven Pipeline</h3>
                <div className="space-y-6">
                  <div className="flex gap-5 items-start">
                    <div className="bg-blue-600 p-2 rounded-xl text-white font-black text-xs">01</div>
                    <div>
                      <h4 className="font-bold text-sm mb-1">BroadcastReceiver</h4>
                      <p className="text-xs text-slate-400 font-medium">Listens for <code>ACTION_ACL_CONNECTED</code>. Executes logic in &lt;10ms.</p>
                    </div>
                  </div>
                  <div className="flex gap-5 items-start">
                    <div className="bg-slate-800 p-2 rounded-xl text-white font-black text-xs">02</div>
                    <div>
                      <h4 className="font-bold text-sm mb-1">MAC Matcher</h4>
                      <p className="text-xs text-slate-400 font-medium">Instantly filters device identity against DataStore persisted bonds.</p>
                    </div>
                  </div>
                  <div className="flex gap-5 items-start">
                    <div className="bg-slate-800 p-2 rounded-xl text-white font-black text-xs">03</div>
                    <div>
                      <h4 className="font-bold text-sm mb-1">Overlay Service</h4>
                      <p className="text-xs text-slate-400 font-medium">Starts, renders Compose UI, and <code>stopSelf()</code> after 4s timeout.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                 <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">Source Manifest</h2>
                 <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-[10px] font-black">Production ready Kotlin/Compose architecture</p>
              </div>
              <div className="flex gap-3">
                 <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-widest">
                    <Cpu size={14} /> Jetpack Compose
                 </div>
                 <div className="bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2 text-slate-600 font-bold text-xs uppercase tracking-widest">
                    <Layers size={14} /> Modular
                 </div>
              </div>
            </div>

            <div className="space-y-12 mt-10">
              {ANDROID_PROJECT_CODE.map((file) => (
                <div key={file.path} className="group transition-all hover:-translate-y-1">
                  <div className="flex items-center justify-between bg-white border border-slate-200 p-5 rounded-t-[2rem] shadow-sm">
                    <div className="flex items-center gap-4 font-bold text-sm text-slate-800">
                      <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 border border-blue-100"><FileCode2 size={22} /></div>
                      <div>
                         <p className="text-base tracking-tight">{file.path.split('/').pop()}</p>
                         <p className="text-[9px] text-slate-400 font-mono font-normal uppercase tracking-widest">{file.path}</p>
                      </div>
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(file.content)} className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-bold text-xs uppercase tracking-widest border border-transparent hover:border-blue-100">
                      <Copy size={16} /> Copy
                    </button>
                  </div>
                  <div className="bg-slate-900 p-10 rounded-b-[2rem] overflow-x-auto text-sm font-mono text-blue-100/80 shadow-2xl ring-1 ring-white/5">
                    <pre><code>{file.content}</code></pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
