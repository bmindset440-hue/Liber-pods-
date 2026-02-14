
export type PopupStyle = 'Minimal' | 'Glass' | 'AMOLED' | 'RGB' | 'Custom';

export interface Device {
  name: string;
  mac: string;
}

export interface AppState {
  selectedDevice: Device | null;
  popupStyle: PopupStyle;
  isApplied: boolean;
  ultraPowerMode: boolean;
}

export interface AndroidFile {
  path: string;
  language: 'kotlin' | 'xml' | 'groovy';
  content: string;
  description: string;
}
