import type { EventKey } from "../types";

const enterKeyListener = (eventKey: EventKey, element: HTMLElement | null, callback: () => void): void => {
  if (element && typeof callback === "function") {
    element.addEventListener("keypress", (e) => {
      if (eventKey === e.key.toLowerCase()) {
        callback();
      }
    });
  }
};

export { enterKeyListener };
