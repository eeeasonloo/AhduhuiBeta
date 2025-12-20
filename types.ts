
export interface PolaroidData {
  id: string;
  url: string;
  date: string;
  label: string;
  filterName: string;
}

export enum CameraStatus {
  IDLE = 'IDLE',
  CAPTURING = 'CAPTURING',
  PRINTING = 'PRINTING',
  ERROR = 'ERROR'
}
