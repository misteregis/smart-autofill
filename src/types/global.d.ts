/// <reference types="firefox-webext-browser" />

declare global {
  const browser: typeof import("firefox-webext-browser").browser;
}

export {};
