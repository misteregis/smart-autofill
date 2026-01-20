// Background script para gerenciar menu de contexto

import type { AutofillData, NotificationOptions, SiteLinks } from "./types/index.d.ts";

let autofillData: AutofillData = {};
let siteLinks: SiteLinks = {};
let profileMenuIds: string[] = []; // Rastrear IDs de menus criados

// Função auxiliar para mostrar notificações apenas se habilitado
async function showNotification(options: NotificationOptions): Promise<void> {
  const settings = await browser.storage.local.get("showNotifications");
  const showNotifications = settings.showNotifications !== false; // Default: true

  if (showNotifications) {
    await browser.notifications.create(options);
  }
}

// Carregar dados ao inicializar
loadData();

// Criar menu de contexto principal
browser.contextMenus.create({
  id: "smart-autofill-main",
  title: "Smart Autofill",
  contexts: ["editable"]
});

// Criar submenu para novo perfil
browser.contextMenus.create({
  id: "create-new-profile",
  parentId: "smart-autofill-main",
  title: "➕ Criar novo perfil",
  contexts: ["editable"]
});

// Listener para quando a aba é atualizada ou ativada
browser.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await browser.tabs.get(activeInfo.tabId);

  if (tab.url && /^https?:\/\//.test(tab.url ?? "")) {
    await updateMenusForUrl(tab.url);
  } else {
    await browser.browserAction.setBadgeText({ text: "" });
  }
});

browser.tabs.onUpdated.addListener(async (_tabId, changeInfo, _tab) => {
  if (changeInfo.url) {
    await updateMenusForUrl(changeInfo.url);
  }
});

// Listener para quando o foco da janela muda
browser.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === browser.windows.WINDOW_ID_NONE) {
    return;
  }

  try {
    const tabs = await browser.tabs.query({ active: true, windowId: windowId });

    if (tabs.length > 0 && tabs[0].url?.startsWith("http")) {
      await updateMenusForUrl(tabs[0].url);
    }
  } catch (error) {
    console.error("Erro ao atualizar badge no foco da janela:", error);
  }
});

// Listener para mudanças no storage
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.autofillData || changes.siteLinks)) {
    loadData();
  }
});

// Listener para cliques no menu de contexto
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  const menuId = info.menuItemId as string;

  if (menuId === "create-new-profile") {
    if (tab) {
      await captureAndCreateProfile(tab);
    }
  } else if (menuId.startsWith("fill-profile-")) {
    const profileIndex = parseInt(menuId.replace("fill-profile-", ""), 10);
    if (tab) {
      await fillProfile(tab, profileIndex);
    }
  }
});

async function loadData(): Promise<void> {
  const data = await browser.storage.local.get(["autofillData", "siteLinks"]);
  autofillData = data.autofillData || {};
  siteLinks = data.siteLinks || {};

  // Atualizar menus para a aba atual
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (tabs.length > 0 && tabs[0].url) {
    await updateMenusForUrl(tabs[0].url);
  }
}

async function updateMenusForUrl(url: string): Promise<void> {
  if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
    // Limpar badge se não for uma URL válida
    await browser.browserAction.setBadgeText({ text: "" });
    return;
  }

  try {
    const origin = new URL(url).origin;

    // Remover menus de perfis antigos e separador
    for (const menuId of profileMenuIds) {
      try {
        await browser.contextMenus.remove(menuId);
      } catch {
        // Menu já foi removido ou não existe
      }
    }
    profileMenuIds = [];

    // Buscar perfis para o site atual
    let profiles = autofillData[origin] || [];

    // Verificar sites vinculados
    for (const [primarySite, linkedSites] of Object.entries(siteLinks)) {
      if (linkedSites?.includes(origin) && autofillData[primarySite]) {
        profiles = [...profiles, ...autofillData[primarySite]];
      }
    }

    // Atualizar badge com número de perfis
    const profileCount = profiles.length;
    if (profileCount > 0) {
      await browser.browserAction.setBadgeText({
        text: profileCount.toString()
      });
      await browser.browserAction.setBadgeBackgroundColor({ color: "#2563eb" });
    } else {
      await browser.browserAction.setBadgeText({ text: "" });
    }

    // Se houver perfis, adicionar separador e listar
    if (profiles.length > 0) {
      await browser.contextMenus.create({
        id: "profile-separator",
        parentId: "smart-autofill-main",
        type: "separator",
        contexts: ["editable"]
      });
      profileMenuIds.push("profile-separator");

      for (let i = 0; i < profiles.length; i++) {
        const profile = profiles[i];
        const menuId = `fill-profile-${i}`;
        await browser.contextMenus.create({
          id: menuId,
          parentId: "smart-autofill-main",
          title: `📝 ${profile.name}`,
          contexts: ["editable"]
        });
        profileMenuIds.push(menuId);
      }
    }
  } catch (error) {
    console.error("Erro ao atualizar menus:", error);
  }
}

async function captureAndCreateProfile(tab: browser.tabs.Tab): Promise<void> {
  try {
    if (!tab.id || !tab.url) {
      return;
    }

    const response = await browser.tabs.sendMessage(tab.id, {
      action: "capture"
    });
    const fields = response.fields;
    const url = new URL(tab.url).origin;

    if (Object.keys(fields).length === 0) {
      await showNotification({
        type: "basic",
        iconUrl: "icons/icon-48.png",
        title: "Smart Autofill",
        message: "Nenhum campo preenchido encontrado! Por favor, preencha os campos do formulário antes de capturar."
      });
      return;
    }

    // Criar nome para o perfil
    const profileName = `Perfil ${new Date().toLocaleString("pt-BR")}`;

    // Salvar perfil
    if (!autofillData[url]) {
      autofillData[url] = [];
    }

    autofillData[url].push({
      name: profileName,
      fields: fields,
      timestamp: Date.now()
    });

    await browser.storage.local.set({ autofillData });

    // Notificar usuário
    await showNotification({
      type: "basic",
      iconUrl: "icons/icon-48.png",
      title: "Smart Autofill",
      message: `Perfil "${profileName}" criado com sucesso!`
    });
  } catch (error) {
    console.error("Erro ao capturar formulário:", error);
    await showNotification({
      type: "basic",
      iconUrl: "icons/icon-48.png",
      title: "Smart Autofill - Erro",
      message: "Erro ao capturar formulário. Verifique se a página contém campos preenchidos."
    });
  }
}

async function fillProfile(tab: browser.tabs.Tab, profileIndex: number): Promise<void> {
  try {
    if (!tab.id || !tab.url) {
      return;
    }

    const url = new URL(tab.url).origin;

    // Buscar perfis para o site atual
    let profiles = autofillData[url] || [];

    // Verificar sites vinculados
    for (const [primarySite, linkedSites] of Object.entries(siteLinks)) {
      if (linkedSites?.includes(url) && autofillData[primarySite]) {
        profiles = [...profiles, ...autofillData[primarySite]];
      }
    }

    const profile = profiles[profileIndex];

    if (!profile) {
      return;
    }

    await browser.tabs.sendMessage(tab.id, {
      action: "fill",
      fields: profile.fields
    });

    // Notificar usuário
    await showNotification({
      type: "basic",
      iconUrl: "icons/icon-48.png",
      title: "Smart Autofill",
      message: `Formulário preenchido com "${profile.name}"`
    });
  } catch (error) {
    console.error("Erro ao preencher formulário:", error);
    await showNotification({
      type: "basic",
      iconUrl: "icons/icon-48.png",
      title: "Smart Autofill - Erro",
      message: "Erro ao preencher formulário."
    });
  }
}
