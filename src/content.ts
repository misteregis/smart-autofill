// Content script para capturar e preencher formulários

import type { AutoFillSettings, AutofillData, AutofillProfile, Message, SiteLinks } from "./types/index.d.ts";

// Preenchimento automático ao carregar a página
(async function autoFill(): Promise<void> {
  const currentOrigin = window.location.origin;
  const data = await browser.storage.local.get(["autofillData", "siteLinks", "autoFillSettings"]);
  const autofillData: AutofillData = data.autofillData || {};
  const siteLinks: SiteLinks = data.siteLinks || {};
  const autoFillSettings: AutoFillSettings = data.autoFillSettings || {};

  // Verificar se há perfil com auto-fill ativado para este site
  const siteData = autofillData[currentOrigin] || [];
  let autoFillProfile: AutofillProfile | null = null;

  // Buscar no site atual
  for (let i = 0; i < siteData.length; i++) {
    const settingKey = `${currentOrigin}_${i}`;
    if (autoFillSettings[settingKey]) {
      autoFillProfile = siteData[i];
      break;
    }
  }

  // Se não encontrou, verificar sites vinculados
  if (!autoFillProfile) {
    for (const [primarySite, linkedSites] of Object.entries(siteLinks)) {
      if (linkedSites.includes(currentOrigin) && autofillData[primarySite]) {
        const linkedData = autofillData[primarySite];
        for (let i = 0; i < linkedData.length; i++) {
          const settingKey = `${primarySite}_${i}`;
          if (autoFillSettings[settingKey]) {
            autoFillProfile = linkedData[i];
            break;
          }
        }
        if (autoFillProfile) break;
      }
    }
  }

  // Se encontrou um perfil com auto-fill ativado, preencher após um pequeno delay
  if (autoFillProfile) {
    setTimeout(() => {
      fillFormData(autoFillProfile?.fields);
    }, 500);
  }
})();

browser.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  if (message.action === "capture") {
    const fields = captureFormData();
    sendResponse({
      fields: fields,
      url: window.location.href
    });
  } else if (message.action === "fill") {
    fillFormData(message.fields);
    sendResponse({ success: true });
  }
  return true;
});

function captureFormData(): Record<string, string> {
  const fields: Record<string, string> = {};

  // Capturar inputs, textareas e selects
  const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    'input:not([type="submit"]):not([type="button"]):not([type="image"]), textarea, select'
  );

  inputs.forEach((input) => {
    let identifier = "";

    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
      identifier = input.name || input.id || input.placeholder || input.type;
    } else if (input instanceof HTMLSelectElement) {
      identifier = input.name || input.id;
    }

    if (!identifier || identifier === "submit" || identifier === "button") {
      return;
    }

    let value = "";

    if (input instanceof HTMLInputElement && (input.type === "checkbox" || input.type === "radio")) {
      value = input.checked ? input.value : "";
    } else if (input instanceof HTMLSelectElement) {
      value = input.options[input.selectedIndex]?.value || "";
    } else {
      value = input.value;
    }

    if (value) {
      // Criar um identificador único
      const uniqueId = `${input.tagName.toLowerCase()}_${identifier}`;
      fields[uniqueId] = value;
    }
  });

  return fields;
}

function fillFormData(fields: Record<string, string>): void {
  Object.entries(fields).forEach(([identifier, value]) => {
    // Tentar encontrar o campo por diferentes métodos
    const [tagName, ...parts] = identifier.split("_");
    const attr = parts.join("_");

    let element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null = null;

    // Tentar por name
    element = document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      `${tagName}[name="${attr}"]`
    );

    // Tentar por id
    if (!element) {
      element = document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        `${tagName}[id="${attr}"]`
      );
    }

    // Tentar por placeholder
    if (!element) {
      element = document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        `${tagName}[placeholder="${attr}"]`
      );
    }

    // Tentar por type
    if (!element) {
      element = document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        `${tagName}[type="${attr}"]`
      );
    }

    if (element) {
      if (element instanceof HTMLInputElement && (element.type === "checkbox" || element.type === "radio")) {
        element.checked = value === element.value;
      } else if (element instanceof HTMLSelectElement) {
        Array.from(element.options).forEach((option) => {
          if (option.value === value) {
            option.selected = true;
          }
        });
      } else {
        element.value = value;

        // Disparar eventos para frameworks reativos
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  });
}
