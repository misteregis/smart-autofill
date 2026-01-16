import type { AutofillData, SiteLinks } from "./types";

let currentUrl: string = "";
let messageTimeout: number | null = null;

// biome-ignore lint/suspicious/noExplicitAny: any needed
const extensionAPI = (globalThis as any).browser ?? (globalThis as any)?.chrome;

document.addEventListener("DOMContentLoaded", async () => {
  // Get current tab URL
  const tabs = await extensionAPI.tabs.query({ active: true, currentWindow: true });
  if (!tabs[0]?.url) {
    return;
  }

  currentUrl = new URL(tabs[0].url).origin;

  const currentSiteElement = document.getElementById("current-site");
  if (currentSiteElement) {
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
      await extensionAPI.windows.create({
        url: extensionAPI.runtime.getURL("options.html"),
        type: "popup",
        focused: true,
      });
    });
  }
});

async function loadProfiles(): Promise<void> {
  const data = await extensionAPI.storage.local.get("autofillData");
  const autofillData: AutofillData = data.autofillData || {};

  // Verificar links de sites
  const links = await extensionAPI.storage.local.get("siteLinks");
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
    profilesList.innerHTML = `
      <div class="text-center py-8 bg-white rounded-xl shadow-sm mx-2">
        <i class="fas fa-clipboard text-4xl text-slate-300 mb-3"></i>
        <p class="text-slate-500 text-sm">Nenhum preenchimento salvo para este site</p>
      </div>
    `;
    return;
  }

  profilesList.innerHTML = siteData
    .map(
      (profile, index) => `
    <div class="profile-card-item bg-white hover:bg-blue-50 border-2 border-transparent hover:border-blue-500 rounded-xl shadow-sm p-4 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] group mx-2" data-index="${index}">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="bg-blue-100 group-hover:bg-blue-600 p-2 rounded-lg transition-colors">
            <i class="fas fa-user text-blue-600 group-hover:text-white transition-colors"></i>
          </div>
          <div>
            <div class="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">${profile.name || `Perfil ${index + 1}`}</div>
            <div class="text-xs text-slate-500">
              <i class="fas fa-list-check mr-1"></i>${Object.keys(profile.fields).length} campos
            </div>
          </div>
        </div>
        <i class="fas fa-chevron-right text-slate-300 group-hover:text-blue-600 transition-colors"></i>
      </div>
    </div>
  `,
    )
    .join("");

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
  const data = await extensionAPI.storage.local.get("autofillData");
  const autofillData: AutofillData = data.autofillData || {};

  // Verificar links de sites
  const links = await extensionAPI.storage.local.get("siteLinks");
  const siteLinks: SiteLinks = links.siteLinks || {};

  let siteData = autofillData[currentUrl] || [];

  // Verificar se há dados vinculados
  for (const [primarySite, linkedSites] of Object.entries(siteLinks)) {
    if (linkedSites.includes(currentUrl) && autofillData[primarySite]) {
      siteData = [...siteData, ...autofillData[primarySite]];
    }
  }

  const profile = siteData[profileIndex];

  const tabs = await extensionAPI.tabs.query({ active: true, currentWindow: true });
  if (tabs[0].id) {
    await extensionAPI.tabs.sendMessage(tabs[0].id, {
      action: "fill",
      fields: profile.fields,
    });
  }

  showMessage("Formulário preenchido com sucesso!", "success");
}

async function captureForm(): Promise<void> {
  const tabs = await extensionAPI.tabs.query({ active: true, currentWindow: true });

  try {
    if (!tabs[0].id) {
      return;
    }

    const response = await extensionAPI.tabs.sendMessage(tabs[0].id, {
      action: "capture",
    });

    if (response?.fields && Object.keys(response.fields).length > 0) {
      const profileName = prompt("Nome deste preenchimento:", `Perfil ${new Date().toLocaleString("pt-BR")}`);

      if (profileName) {
        const data = await extensionAPI.storage.local.get("autofillData");
        const autofillData: AutofillData = data.autofillData || {};

        if (!autofillData[currentUrl]) {
          autofillData[currentUrl] = [];
        }

        autofillData[currentUrl].push({
          name: profileName,
          fields: response.fields,
          url: response.url,
          createdAt: new Date().toISOString(),
        });

        await extensionAPI.storage.local.set({ autofillData });

        showMessage("Preenchimento capturado com sucesso!", "success");
        loadProfiles();
      }
    } else {
      showMessage("Nenhum campo de formulário encontrado na página", "error");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    showMessage(`Erro ao capturar formulário:  ${errorMessage}`, "error");
  }
}

function showMessage(text: string, type: "success" | "error"): void {
  const messageEl = document.getElementById("message");
  if (!messageEl) {
    return;
  }

  const isSuccess = type === "success";
  const icon = isSuccess ? "fa-circle-check" : "fa-circle-exclamation";
  const bgColor = isSuccess ? "bg-green-50" : "bg-red-50";
  const borderColor = isSuccess ? "border-green-500" : "border-red-500";
  const textColor = isSuccess ? "text-green-800" : "text-red-800";
  const iconColor = isSuccess ? "text-green-600" : "text-red-600";

  messageEl.innerHTML = `
    <div class="${bgColor} ${textColor} ${borderColor} border-l-4 rounded-lg p-4 shadow-sm flex items-center gap-3">
      <i class="fas ${icon} ${iconColor} text-xl"></i>
      <span class="font-medium">${text}</span>
    </div>
  `;
  messageEl.classList.remove("hidden");

  if (messageTimeout !== null) {
    clearTimeout(messageTimeout);
  }

  messageTimeout = window.setTimeout(() => {
    messageEl.classList.add("hidden");
  }, 3000);
}
