import type { EventKey } from "../types";

const addKeypressListener = (type: string, key: string, element: HTMLElement, callback: () => void): void => {
  element.addEventListener(type as string, (e) => {
    if ((e as KeyboardEvent).key.toLowerCase() === key.toLowerCase()) {
      callback();
    }
  });
};

const enterKeyListener = (eventKey: EventKey, targetElement: HTMLElement[] | HTMLElement | null, callback: () => void): void => {
  if (targetElement && typeof callback === "function") {
    if (Array.isArray(targetElement)) {
      targetElement.forEach((element) => {
        addKeypressListener("keypress", eventKey, element, callback);
      });
    } else {
      addKeypressListener("keypress", eventKey, targetElement, callback);
    }
  }
};

export { enterKeyListener };
