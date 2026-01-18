import { createElementsFromString } from "../utils/strings-util.js";
import { createSvg } from "../utils/svg-util.js";

const ToastService = (() => {
  const activeToasts = new Map();
  const ANIMATION_RESET_DELAY = 50;
  const MAX_TOASTS = 5;
  const icons: Record<string, HTMLElement> = {};

  const typeClasses = {
    success: "bg-green-50 text-green-800 border-green-500",
    error: "bg-red-50 text-red-800 border-red-500",
    warn: "bg-amber-50 text-amber-800 border-amber-500",
    info: "bg-blue-600 text-white border-blue-800"
  };

  /* ---------------- HELPERS ---------------- */
  function hash(str: string) {
    let h = 0;

    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }

    return h;
  }

  /* ---------------- REMOVE TOAST ---------------- */
  function removeToast(key: string) {
    const toast = activeToasts.get(key);

    if (!toast) return;

    activeToasts.delete(key);

    toast.addEventListener("transitionend", toast.remove, { once: true });

    setTimeout(() => toast.classList.add("translate-x-88"), 10);
  }

  /* ---------------- FLIP ANIMATION ---------------- */
  function animateReorder(container: HTMLElement) {
    const items = [...container.children];

    const firstRects = new Map();
    items.forEach((el: Element) => {
      firstRects.set(el, el.getBoundingClientRect());
    });

    // força reflow
    void container.offsetHeight;

    requestAnimationFrame(() => {
      // biome-ignore lint/suspicious/noExplicitAny: needed for DOM elements
      items.forEach((el: any) => {
        const lastRect = el.getBoundingClientRect();
        const firstRect = firstRects.get(el);

        const deltaY = firstRect.top - lastRect.top;

        if (deltaY) {
          el.style.transform = `translateY(${deltaY}px)`;
          el.style.transition = "none";

          requestAnimationFrame(() => {
            el.style.transform = "";
            el.style.transition = "";
          });
        }
      });
    });
  }

  /* ---------------- CORE ---------------- */
  function show(message: string, type: "success" | "error" | "warn" | "info" = "info", duration = 3000) {
    const container = document.getElementById("toast-container");

    if (!container) {
      return;
    }

    const key = `${type}::${hash(message)}`;
    let toast = activeToasts.get(key);

    if (toast) {
      animateReorder(container);
      // ⬆️ Move para o topo visual
      container.appendChild(toast);

      // 🔁 Reinicia animação com delay mínimo
      toast.classList.remove("opacity-100", "translate-x-0");

      clearTimeout(toast._restartTimer);
      toast._restartTimer = setTimeout(() => {
        toast.classList.add("opacity-100", "translate-x-0");
      }, ANIMATION_RESET_DELAY);
    } else {
      toast = document.createElement("div");
      toast._timeout = null;
      toast._key = key;

      toast.className = `
                flex items-center cursor-pointer transition-transform duration-300 ease-out
                border-l-4 rounded-lg p-4 shadow-sm translate-x-88 gap-3
                ${typeClasses[type] ?? typeClasses.info}
            `.trim();

      if (Object.keys(icons).length === 0) {
        Object.assign(icons, {
          success: createSvg("circle-check", "size-5 text-green-600", [640, 640]),
          error: createSvg("circle-exclamation", "size-5 text-red-600", [640, 640]),
          warn: createSvg("triangle-exclamation", "size-5 text-amber-600", [640, 640]),
          info: createSvg("info-circle", "size-5 text-white", [640, 640], null)
        });
      }

      toast.addEventListener("click", () => removeToast(key));
      toast.appendChild(icons[type]);

      const msg = message.replace(/<b>(.*)<\/b>/g, '<span class="font-semibold">$1</span>');
      const span = document.createElement("span");
      span.className = "flex-1 font-medium";
      span.appendChild(createElementsFromString(msg));

      toast.appendChild(span);

      animateReorder(container);

      container.appendChild(toast);
      activeToasts.set(key, toast);

      // animação de entrada
      requestAnimationFrame(() => setTimeout(() => toast.classList.remove("translate-x-88"), 10));
    }

    clearTimeout(toast._timeout);

    toast._timeout = setTimeout(() => removeToast(key), duration);

    // 🧹 Maximum limit
    while (activeToasts.size > MAX_TOASTS) {
      const oldest = container.firstElementChild;

      if (oldest && "_key" in oldest) {
        removeToast(oldest._key as string);
        break;
      }
    }
  }

  return {
    success: (msg: string, duration?: number) => show(msg, "success", duration),
    error: (msg: string, duration?: number) => show(msg, "error", duration),
    warn: (msg: string, duration?: number) => show(msg, "warn", duration),
    info: (msg: string, duration?: number) => show(msg, "info", duration),
    show
  };
})();

export default ToastService;
