import ToastService from "./services/toast-service";
import type { AutofillData, SiteLinks } from "./types";
import { createSvg } from "./utils/svg-util.js";

let currentUrl: string = "";

document.addEventListener("DOMContentLoaded", async () => {
  // Get current tab URL
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tabs[0]?.url) {
    return;
  }

  currentUrl = new URL(tabs[0].url).origin;

  const currentSiteElement = document.getElementById("current-site");

  if (currentSiteElement) {
    if (currentUrl === "null" || !currentUrl.startsWith("http")) {
      currentUrl = "(não disponível)";
    }

    currentSiteElement.textContent = `Site atual: ${currentUrl}`;
  }

  loadProfiles();

  const captureBtn = document.getElementById("capture-btn");
  const optionsBtn = document.getElementById("options-btn");

  if (captureBtn) {
    captureBtn.addEventListener("click", captureForm);
  }

  if (optionsBtn) {
    optionsBtn.addEventListener("click", async () => {
      const site = currentUrl !== "(não disponível)" ? `#${encodeURIComponent(currentUrl)}` : "";
      // browser.runtime.openOptionsPage();
      await browser.windows.create({
        url: browser.runtime.getURL(`options.html${decodeURIComponent(site)}`),
        type: "popup",
        focused: true
      });
    });
  }
});

async function loadProfiles(): Promise<void> {
  const data = await browser.storage.local.get("autofillData");
  const autofillData: AutofillData = data.autofillData || {};

  // Verificar links de sites
  const links = await browser.storage.local.get("siteLinks");
  const siteLinks: SiteLinks = links.siteLinks || {};

  // Encontrar o site principal ou sites vinculados
  let siteData = autofillData[currentUrl] || [];

  // Verificar se há dados vinculados de outros sites
  for (const [primarySite, linkedSites] of Object.entries(siteLinks)) {
    if (linkedSites.includes(currentUrl) && autofillData[primarySite]) {
      siteData = [...siteData, ...autofillData[primarySite]];
    }
  }

  const profilesList = document.getElementById("profiles-list");

  if (!profilesList) {
    return;
  }

  if (siteData.length === 0) {
    profilesList.textContent = "";
    const div = document.createElement("div");
    div.className = "flex flex-col text-center py-8 bg-white rounded-xl shadow-sm mx-2";

    const icon = createSvg("clipboard", ["h-9.25", "text-slate-300", "mb-3"], [384, 512]);

    const p = document.createElement("p");
    p.className = "text-slate-500 text-sm";
    p.textContent = "Nenhum preenchimento salvo para este site";

    div.appendChild(icon);
    div.appendChild(p);
    profilesList.appendChild(div);
    return;
  }

  profilesList.textContent = "";
  siteData.forEach((profile, index) => {
    const card = document.createElement("div");
    card.className =
      "profile-card-item bg-white hover:bg-blue-50 border-2 border-transparent hover:border-blue-500 rounded-xl shadow-sm p-4 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] group mx-2";
    card.dataset.index = String(index);

    const flexDiv = document.createElement("div");
    flexDiv.className = "flex items-center justify-between";

    const leftDiv = document.createElement("div");
    leftDiv.className = "flex items-center gap-3";

    const iconWrapper = document.createElement("div");
    iconWrapper.className = "bg-blue-100 group-hover:bg-blue-600 px-2 py-3 rounded-lg transition-colors";
    const userIcon = createSvg(
      "user",
      ["h-4", "text-blue-600", "group-hover:text-white", "transition-colors"],
      [448, 512]
    );
    iconWrapper.appendChild(userIcon);

    const textDiv = document.createElement("div");

    const nameDiv = document.createElement("div");
    nameDiv.className = "font-semibold text-slate-800 group-hover:text-blue-600 transition-colors";
    nameDiv.textContent = profile.name || `Perfil ${index + 1}`;

    const fieldsCount = Object.keys(profile.fields).length;
    const fieldsCountSpan = document.createElement("span");
    fieldsCountSpan.textContent = `${fieldsCount} campo${fieldsCount !== 1 ? "s" : ""}`;

    const statsDiv = document.createElement("div");
    statsDiv.className = "flex items-center text-xs text-slate-500 gap-1";
    const statsIcon = createSvg("list-check", "size-3.25");
    statsDiv.appendChild(statsIcon);
    statsDiv.appendChild(fieldsCountSpan);

    textDiv.appendChild(nameDiv);
    textDiv.appendChild(statsDiv);
    leftDiv.appendChild(iconWrapper);
    leftDiv.appendChild(textDiv);

    const chevron = createSvg(
      "chevron-right",
      ["text-slate-300", "group-hover:text-blue-600", "transition-colors"],
      [320, 512]
    );

    flexDiv.appendChild(leftDiv);
    flexDiv.appendChild(chevron);
    card.appendChild(flexDiv);
    profilesList.appendChild(card);
  });

  document.querySelectorAll(".profile-card-item").forEach((item) => {
    item.addEventListener("click", () => {
      const index = (item as HTMLElement).dataset.index;
      if (index) {
        fillForm(parseInt(index, 10));
      }
    });
  });
}

async function fillForm(profileIndex: number): Promise<void> {
  const data = await browser.storage.local.get("autofillData");
  const autofillData: AutofillData = data.autofillData || {};

  // Verificar links de sites
  const links = await browser.storage.local.get("siteLinks");
  const siteLinks: SiteLinks = links.siteLinks || {};

  let siteData = autofillData[currentUrl] || [];

  // Verificar se há dados vinculados
  for (const [primarySite, linkedSites] of Object.entries(siteLinks)) {
    if (linkedSites.includes(currentUrl) && autofillData[primarySite]) {
      siteData = [...siteData, ...autofillData[primarySite]];
    }
  }

  const profile = siteData[profileIndex];

  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (tabs[0].id) {
    await browser.tabs.sendMessage(tabs[0].id, {
      action: "fill",
      fields: profile.fields
    });
  }

  ToastService.success("Formulário preenchido com sucesso!");
}

async function captureForm(): Promise<void> {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });

  try {
    if (!tabs[0].id) {
      return;
    }

    const response = await browser.tabs.sendMessage(tabs[0].id, {
      action: "capture"
    });

    if (response?.fields && Object.keys(response.fields).length > 0) {
      const profileName = prompt("Nome deste preenchimento:", `Perfil ${new Date().toLocaleString("pt-BR")}`);

      if (profileName) {
        const data = await browser.storage.local.get("autofillData");
        const autofillData: AutofillData = data.autofillData || {};

        if (!autofillData[currentUrl]) {
          autofillData[currentUrl] = [];
        }

        autofillData[currentUrl].push({
          name: profileName,
          fields: response.fields,
          url: response.url,
          createdAt: new Date().toISOString()
        });

        await browser.storage.local.set({ autofillData });

        ToastService.success("Preenchimento capturado com sucesso!");

        loadProfiles();
      }
    } else {
      ToastService.warn("Nenhum campo de formulário encontrado na página");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

    ToastService.error(`Erro ao capturar formulário:  ${errorMessage}`);
  }
}
