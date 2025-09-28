// Common types to replace 'any' usage

export interface FirebaseError {
  code: string;
  message: string;
  name: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  message: string;
  timestamp: number;
  read: boolean;
  senderType: 'user' | 'admin';
}

export interface FormEvent extends Event {
  target: HTMLFormElement;
  preventDefault: () => void;
}

export interface ChangeEvent extends Event {
  target: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
}

export interface FileChangeEvent extends Event {
  target: HTMLInputElement & { files: FileList | null };
}

export interface ImageProcessingOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Event handler types
export type EventHandler<T = Element> = (event: Event & { target: T }) => void;
export type MouseEventHandler = (event: MouseEvent) => void;
export type ClickEventHandler = (event: MouseEvent) => void;

// Generic object types
export type StringRecord = Record<string, string>;
export type NumberRecord = Record<string, number>;
export type AnyRecord = Record<string, unknown>;

// Firebase document data
export interface FirebaseDoc {
  id: string;
  [key: string]: unknown;
}