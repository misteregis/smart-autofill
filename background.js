// Background script para gerenciar menu de contexto

let autofillData = {};
let siteLinks = {};
let currentTabUrl = "";
let profileMenuIds = []; // Rastrear IDs de menus criados

// Função auxiliar para mostrar notificações apenas se habilitado
async function showNotification(options) {
  const settings = await browser.storage.local.get('showNotifications');
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
  await updateMenusForUrl(tab.url);
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    await updateMenusForUrl(changeInfo.url);
  }
});

// Listener para mudanças no storage
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.autofillData || changes.siteLinks)) {
    loadData();
  }
});

// Listener para cliques no menu de contexto
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  const menuId = info.menuItemId;

  if (menuId === "create-new-profile") {
    await captureAndCreateProfile(tab);
  } else if (menuId.startsWith("fill-profile-")) {
    const profileIndex = parseInt(menuId.replace("fill-profile-", ""));
    await fillProfile(tab, profileIndex);
  }
});

async function loadData() {
  const data = await browser.storage.local.get(['autofillData', 'siteLinks']);
  autofillData = data.autofillData || {};
  siteLinks = data.siteLinks || {};

  // Atualizar menus para a aba atual
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (tabs.length > 0) {
    await updateMenusForUrl(tabs[0].url);
  }
}

async function updateMenusForUrl(url) {
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    // Limpar badge se não for uma URL válida
    await browser.browserAction.setBadgeText({ text: '' });
    return;
  }

  try {
    const origin = new URL(url).origin;
    currentTabUrl = origin;

    // Remover menus de perfis antigos e separador
    for (const menuId of profileMenuIds) {
      try {
        await browser.contextMenus.remove(menuId);
      } catch (e) {
        // Menu já foi removido ou não existe
      }
    }
    profileMenuIds = [];

    // Buscar perfis para o site atual
    let profiles = autofillData[origin] || [];

    // Verificar sites vinculados
    for (const [primarySite, linkedSites] of Object.entries(siteLinks)) {
      if (linkedSites && linkedSites.includes(origin) && autofillData[primarySite]) {
        profiles = [...profiles, ...autofillData[primarySite]];
      }
    }

    // Atualizar badge com número de perfis
    const profileCount = profiles.length;
    if (profileCount > 0) {
      await browser.browserAction.setBadgeText({ text: profileCount.toString() });
      await browser.browserAction.setBadgeBackgroundColor({ color: '#2563eb' });
    } else {
      await browser.browserAction.setBadgeText({ text: '' });
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
    console.error('Erro ao atualizar menus:', error);
  }
}

async function captureAndCreateProfile(tab) {
  try {
    const response = await browser.tabs.sendMessage(tab.id, { action: 'capture' });
    const fields = response.fields;
    const url = new URL(tab.url).origin;

    if (Object.keys(fields).length === 0) {
      await showNotification({
        type: "basic",
        iconUrl: "icons/icon-48.png",
        title: "Smart Autofill",
        message: "Nenhum campo encontrado na página!"
      });
      return;
    }

    // Criar nome para o perfil
    const timestamp = new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    const profileName = `Perfil ${timestamp}`;

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
    console.error('Erro ao capturar formulário:', error);
    await showNotification({
      type: "basic",
      iconUrl: "icons/icon-48.png",
      title: "Smart Autofill - Erro",
      message: "Erro ao capturar formulário. Verifique se a página tem campos preenchidos."
    });
  }
}

async function fillProfile(tab, profileIndex) {
  try {
    const url = new URL(tab.url).origin;

    // Buscar perfis para o site atual
    let profiles = autofillData[url] || [];

    // Verificar sites vinculados
    for (const [primarySite, linkedSites] of Object.entries(siteLinks)) {
      if (linkedSites && linkedSites.includes(url) && autofillData[primarySite]) {
        profiles = [...profiles, ...autofillData[primarySite]];
      }
    }

    const profile = profiles[profileIndex];

    if (!profile) {
      return;
    }

    await browser.tabs.sendMessage(tab.id, {
      action: 'fill',
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
    console.error('Erro ao preencher formulário:', error);
    await showNotification({
      type: "basic",
      iconUrl: "icons/icon-48.png",
      title: "Smart Autofill - Erro",
      message: "Erro ao preencher formulário."
    });
  }
}
