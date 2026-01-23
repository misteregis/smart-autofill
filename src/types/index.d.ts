/// <reference types="firefox-webext-browser" />

export interface AutofillProfile {
  name: string;
  fields: Record<string, string>;
  timestamp?: number;
  url?: string;
  createdAt?: string;
}

export interface AutofillData {
  [origin: string]: AutofillProfile[];
}

export interface SiteLinks {
  [primarySite: string]: string[];
}

export interface AutoFillSettings {
  [key: string]: boolean;
}

export interface NotificationOptions {
  type: "basic";
  iconUrl: string;
  title: string;
  message: string;
}

export interface CaptureMessage {
  action: "capture";
}

export interface FillMessage {
  action: "fill";
  fields: Record<string, string>;
}

export type Message = CaptureMessage | FillMessage;

export interface ExportData {
  version: string;
  exportDate: string;
  data: {
    autofillData: AutofillData;
    siteLinks: SiteLinks;
    autoFillSettings: AutoFillSettings;
    showNotifications?: boolean;
  };
}

export type EventKey = "enter";
export type ModalType = "danger" | "info" | "success" | "warning";
export type IconType =
  | "ban"
  | "bolt"
  | "check-circle"
  | "exclamation-circle"
  | "exclamation-triangle"
  | "eye"
  | "eye-slash"
  | "globe"
  | "inbox"
  | "info-circle"
  | "link"
  | "pen"
  | "plus"
  | "tag"
  | "times"
  | "times-circle"
  | "trash"
  | "unknown"
  | "unlink"
  | "user"
  | "users";
