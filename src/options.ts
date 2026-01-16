import type { AutoFillSettings, AutofillData, AutofillProfile, ExportData, SiteLinks } from "./types/index.d.ts";

let currentSite: string | null = null;

let autofillData: AutofillData = {};
let siteLinks: SiteLinks = {};
let autoFillSettings: AutoFillSettings = {};

// Função para mostrar modal de alerta customizado
function showAlert(message: string, title = "Aviso", icon = "fa-info-circle", type = "info"): Promise<void> {
  return new Promise((resolve) => {
    const modal = document.getElementById("alert-modal");
    const titleElement = document.getElementById("alert-title");
    const messageElement = document.getElementById("alert-message");
    const iconElement = document.getElementById("alert-icon");
    const headerElement = document.getElementById("alert-header");
    const okBtn = document.getElementById("alert-ok");

    if (!(modal && titleElement && messageElement && iconElement && headerElement && okBtn)) {
      resolve();
      return;
    }

    titleElement.textContent = title;
    messageElement.innerHTML = message.replace(/\n/g, "<br>");
    iconElement.className = `fas ${icon} text-white text-xl`;

    // Definir cores baseado no tipo
    const colors: Record<string, string> = {
      info: "from-blue-500 to-blue-600",
      warning: "from-yellow-500 to-yellow-600",
      error: "from-red-500 to-red-600",
      success: "from-green-500 to-green-600",
    };
    headerElement.className = `bg-gradient-to-r ${colors[type] || colors.info} px-6 py-5 flex items-center gap-3`;

    modal.classList.remove("hidden");
    modal.classList.add("flex");

    const handleOk = (): void => {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      okBtn.removeEventListener("click", handleOk);
      document.removeEventListener("keydown", handleEscape);
      resolve();
    };

    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === "Escape" || e.key === "Enter") {
        handleOk();
      }
    };

    okBtn.addEventListener("click", handleOk);
    document.addEventListener("keydown", handleEscape);
  });
}

// Função para mostrar modal de confirmação customizado
function showConfirm(message: string, title = "Confirmar ação", icon = "fa-exclamation-triangle"): Promise<boolean> {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirm-modal");
    const titleElement = document.getElementById("confirm-title");
    const messageElement = document.getElementById("confirm-message");
    const iconElement = document.getElementById("confirm-icon");
    const okBtn = document.getElementById("confirm-ok");
    const cancelBtn = document.getElementById("confirm-cancel");

    if (!(modal && titleElement && messageElement && iconElement && okBtn && cancelBtn)) {
      resolve(false);
      return;
    }

    titleElement.textContent = title;
    messageElement.textContent = message;
    iconElement.className = `fas ${icon} text-white text-xl`;

    modal.classList.remove("hidden");
    modal.classList.add("flex");

    const handleOk = (): void => {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      okBtn.removeEventListener("click", handleOk);
      cancelBtn.removeEventListener("click", handleCancel);
      document.removeEventListener("keydown", handleEscape);
      resolve(true);
    };

    const handleCancel = (): void => {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      okBtn.removeEventListener("click", handleOk);
      cancelBtn.removeEventListener("click", handleCancel);
      document.removeEventListener("keydown", handleEscape);
      resolve(false);
    };

    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        handleCancel();
      }
    };

    okBtn.addEventListener("click", handleOk);
    cancelBtn.addEventListener("click", handleCancel);
    document.addEventListener("keydown", handleEscape);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  renderSitesList();

  // Carregar preferência de notificações
  const notifSettings = await browser.storage.local.get("showNotifications");
  const showNotifications = notifSettings.showNotifications !== false; // Default: true

  const showNotificationsCheckbox = document.getElementById("show-notifications") as HTMLInputElement;
  if (showNotificationsCheckbox) {
    showNotificationsCheckbox.checked = showNotifications;

    // Listener para mudança na configuração de notificações
    showNotificationsCheckbox.addEventListener("change", async (e) => {
      await browser.storage.local.set({
        showNotifications: (e.target as HTMLInputElement).checked,
      });
    });
  }

  // Exportar/Importar dados
  const exportBtn = document.getElementById("export-data-btn");
  const importBtn = document.getElementById("import-data-btn");
  const importFileInput = document.getElementById("import-file-input") as HTMLInputElement;

  if (exportBtn) {
    exportBtn.addEventListener("click", exportData);
  }

  if (importBtn) {
    importBtn.addEventListener("click", () => {
      if (importFileInput) {
        importFileInput.click();
      }
    });
  }

  if (importFileInput) {
    importFileInput.addEventListener("change", importData);
  }

  // Modal controls
  const modal = document.getElementById("link-modal");
  const closeBtn = document.querySelector(".close");
  const linkSitesBtn = document.getElementById("link-sites-btn");
  const addLinkBtn = document.getElementById("add-link-btn");

  const closeLinkModal = (): void => {
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  };

  if (linkSitesBtn) {
    linkSitesBtn.addEventListener("click", () => {
      showLinkModal();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeLinkModal);
  }

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeLinkModal();
    }
  });

  // Fechar modal com ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("flex")) {
      closeLinkModal();
    }
  });

  if (addLinkBtn) {
    addLinkBtn.addEventListener("click", addLinkedSite);
  }

  const newLinkUrlInput = document.getElementById("new-link-url");
  if (newLinkUrlInput) {
    newLinkUrlInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        addLinkedSite();
      }
    });
  }
});

async function loadData(): Promise<void> {
  const data = await browser.storage.local.get(["autofillData", "siteLinks", "autoFillSettings"]);
  autofillData = data.autofillData || {};
  siteLinks = data.siteLinks || {};
  autoFillSettings = data.autoFillSettings || {};
}

const profileText = (profiles: AutofillProfile[]): string => (profiles.length === 1 ? "perfil" : "perfis");

function renderSitesList(): void {
  const sitesList = document.getElementById("sites-list");
  if (!sitesList) {
    return;
  }

  const sites = Object.keys(autofillData);

  if (sites.length === 0) {
    sitesList.innerHTML =
      '<p class="text-slate-400 text-sm text-center py-4"><i class="fas fa-inbox mr-2"></i>Nenhum site salvo ainda</p>';
    return;
  }

  sitesList.innerHTML = sites
    .map(
      (site) => `
    <div class="site-item-card group cursor-pointer bg-slate-50 hover:bg-blue-50 border-l-4 border-transparent hover:border-blue-600 rounded-lg p-3 transition-all duration-200" data-site="${site}">
      <div class="flex items-start gap-2">
        <i class="fas fa-globe text-slate-400 group-hover:text-blue-600 mt-1 transition-colors"></i>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-slate-700 group-hover:text-blue-600 truncate transition-colors">${site}</div>
          <div class="text-xs text-slate-500 mt-1">
            <i class="fas fa-users mr-1"></i>${autofillData[site].length} ${profileText(autofillData[site])}
          </div>
        </div>
      </div>
    </div>
  `,
    )
    .join("");

  document.querySelectorAll(".site-item-card").forEach((item) => {
    item.addEventListener("click", () => {
      const site = (item as HTMLElement).dataset.site;
      if (site) {
        selectSite(site);
      }
    });
  });

  selectSite();
}

function selectSite(site: string | null = currentSite): void {
  if (!site) {
    return;
  }

  currentSite = site;

  const emptyState = document.getElementById("empty-state");
  const siteDetails = document.getElementById("site-details");
  const siteName = document.getElementById("site-name");

  if (emptyState) emptyState.style.display = "none";
  if (siteDetails) siteDetails.style.display = "block";
  if (siteName) siteName.textContent = site;

  const item = document.querySelector(`[data-site="${site}"]`);
  document.querySelectorAll(".site-item-card").forEach((i) => {
    i.classList.remove("!bg-blue-100", "!border-blue-600", "active");
  });
  item?.classList.add("!bg-blue-100", "!border-blue-600", "active");

  renderProfiles();
}

function renderProfiles(): void {
  const container = document.getElementById("profiles-container");
  if (!(container && currentSite)) {
    return;
  }

  const profiles = autofillData[currentSite] || [];

  container.innerHTML = profiles
    .map((profile, profileIndex) => {
      const settingKey = `${currentSite}_${profileIndex}`;
      const isAutoFill = autoFillSettings[settingKey];

      return `
    <div class="bg-white rounded-xl shadow-sm overflow-hidden" data-profile="${profileIndex}">
      <div class="bg-linear-to-r from-white to-slate-50 px-6 py-4 flex justify-between items-center border-b border-slate-200">
        <div class="flex items-center gap-3">
          <div class="bg-blue-600 p-2 rounded-lg">
            <i class="fas fa-user text-white"></i>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-slate-800">${profile.name}</h3>
            <label class="flex items-center gap-2 mt-2 cursor-pointer group">
              <input type="checkbox" class="auto-fill-checkbox w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer" data-profile="${profileIndex}" ${isAutoFill ? "checked" : ""}>
              <span class="text-sm text-slate-600 group-hover:text-blue-600 transition-colors">
                <i class="fas fa-bolt text-xs"></i> Preencher automaticamente ao carregar
              </span>
            </label>
          </div>
        </div>
        <button class="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2 delete-profile" data-profile="${profileIndex}">
          <i class="fas fa-trash"></i>
          <span>Excluir Perfil</span>
        </button>
      </div>

      <div class="p-6 space-y-3" data-profile="${profileIndex}">
        ${Object.entries(profile.fields)
          .map(([fieldName, fieldValue]) => {
            const isPasswordField = /password|senha|pass|pwd/i.test(fieldName);
            const inputType = isPasswordField ? "password" : "text";
            return `
          <div class="grid grid-cols-[200px_1fr_auto] gap-3 items-center bg-slate-50 p-3 rounded-lg" data-field="${fieldName}">
            <div class="flex items-center gap-2 font-medium text-slate-700">
              <i class="fas fa-tag text-slate-400 text-sm"></i>
              <span class="truncate">${fieldName}</span>
            </div>
            <div class="relative flex-1">
              <input type="${inputType}" class="field-value w-full px-4 py-2 ${isPasswordField ? "pr-10" : ""} border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" value="${fieldValue}" data-field="${fieldName}" data-profile="${profileIndex}">
              ${
                isPasswordField
                  ? `
              <button type="button" class="toggle-password absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors w-7 p-1" data-field="${fieldName}" data-profile="${profileIndex}">
                <i class="fas fa-eye"></i>
              </button>
              `
                  : ""
              }
            </div>
            <button class="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors duration-200 delete-field w-10" data-field="${fieldName}" data-profile="${profileIndex}">
              <i class="fas fa-times"></i>
            </button>
          </div>
        `;
          })
          .join("")}
      </div>

      <div class="bg-white px-6 py-4 border-t border-slate-200">
        <div class="grid grid-cols-[200px_1fr_auto] gap-3">
          <input type="text" class="new-field-name px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="Nome do campo" data-profile="${profileIndex}">
          <input type="text" class="new-field-value px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="Valor do campo" data-profile="${profileIndex}">
          <button class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 rounded-lg transition-colors duration-200 flex items-center gap-2 whitespace-nowrap add-field-btn" data-profile="${profileIndex}">
            <i class="fas fa-plus"></i>
            <span>Adicionar</span>
          </button>
        </div>
      </div>
    </div>
  `;
    })
    .filter((html) => html !== "")
    .join("");

  // Event listeners para auto-fill checkbox
  document.querySelectorAll(".auto-fill-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", toggleAutoFill);
  });

  // Event listeners para toggle de visualização de senha
  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", togglePasswordVisibility);
  });

  // Event listeners para alteração de valores
  document.querySelectorAll(".field-value").forEach((input) => {
    input.addEventListener("change", updateFieldValue);
  });

  // Event listeners para exclusão de campos
  document.querySelectorAll(".delete-field").forEach((btn) => {
    btn.addEventListener("click", deleteField);
  });

  // Event listeners para adicionar campos
  document.querySelectorAll(".add-field-btn").forEach((btn) => {
    btn.addEventListener("click", addField);
  });

  // Event listeners para excluir perfil
  document.querySelectorAll(".delete-profile").forEach((btn) => {
    btn.addEventListener("click", deleteProfile);
  });
}

function togglePasswordVisibility(e: Event): void {
  e.preventDefault();
  e.stopPropagation();

  const button = e.currentTarget as HTMLButtonElement;
  const icon = button.querySelector("i");
  const container = button.closest(".relative");
  const input = container?.querySelector(".field-value") as HTMLInputElement;

  if (!(input && icon)) {
    return;
  }

  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}

async function toggleAutoFill(e: Event): Promise<void> {
  const checkbox = e.currentTarget as HTMLInputElement;
  const profileIndex = Number.parseInt(checkbox.dataset.profile || "", 10);

  if (Number.isNaN(profileIndex) || !currentSite) {
    console.error("Índice de perfil inválido");
    return;
  }

  const settingKey = `${currentSite}_${profileIndex}`;

  if (checkbox.checked) {
    // Desmarcar todos os outros checkboxes do mesmo site
    const profiles = autofillData[currentSite] || [];
    profiles.forEach((_, idx) => {
      const key = `${currentSite}_${idx}`;
      if (idx !== profileIndex) {
        delete autoFillSettings[key];
      }
    });

    // Marcar o atual
    autoFillSettings[settingKey] = true;
  } else {
    delete autoFillSettings[settingKey];
  }

  await browser.storage.local.set({ autoFillSettings });
  renderProfiles(); // Re-renderizar para atualizar os checkboxes
}

async function updateFieldValue(e: Event): Promise<void> {
  const input = e.currentTarget as HTMLInputElement;
  const profileIndex = Number.parseInt(input.dataset.profile || "", 10);
  const fieldName = input.dataset.field;
  const newValue = input.value;

  if (Number.isNaN(profileIndex) || !currentSite || !fieldName) {
    console.error("Índice de perfil inválido");
    return;
  }

  if (!autofillData[currentSite]?.[profileIndex]) {
    console.error("Perfil não encontrado:", currentSite, profileIndex);
    await loadData();
    renderProfiles();
    return;
  }

  autofillData[currentSite][profileIndex].fields[fieldName] = newValue;
  await browser.storage.local.set({ autofillData });
}

async function deleteField(e: Event): Promise<void> {
  const button = e.currentTarget as HTMLButtonElement;
  const profileIndex = Number.parseInt(button.dataset.profile || "", 10);
  const fieldName = button.dataset.field;

  if (Number.isNaN(profileIndex) || !currentSite || !fieldName) {
    console.error("Índice de perfil inválido");
    return;
  }

  if (!autofillData[currentSite]?.[profileIndex]) {
    console.error("Perfil não encontrado:", currentSite, profileIndex);
    await loadData();
    renderProfiles();
    return;
  }

  const confirmed = await showConfirm(`Excluir o campo "${fieldName}"?`, "Excluir campo", "fa-trash");
  if (confirmed) {
    delete autofillData[currentSite][profileIndex].fields[fieldName];
    await browser.storage.local.set({ autofillData });
    renderProfiles();
  }
}

async function addField(e: Event): Promise<void> {
  const button = e.currentTarget as HTMLButtonElement;
  const profileIndex = Number.parseInt(button.dataset.profile || "", 10);

  if (Number.isNaN(profileIndex) || !currentSite) {
    console.error("Índice de perfil inválido");
    return;
  }

  const card = button.closest("div[data-profile]");

  if (!card) {
    console.error("Card do perfil não encontrado");
    return;
  }

  const nameInput = card.querySelector(".new-field-name") as HTMLInputElement;
  const valueInput = card.querySelector(".new-field-value") as HTMLInputElement;

  const fieldName = nameInput.value.trim();
  const fieldValue = valueInput.value.trim();

  if (!fieldName) {
    await showAlert("Digite o nome do campo", "Campo obrigatório", "fa-exclamation-circle", "warning");
    return;
  }

  if (!autofillData[currentSite]?.[profileIndex]) {
    console.error("Perfil não encontrado:", currentSite, profileIndex);
    await loadData();
    renderProfiles();
    return;
  }

  autofillData[currentSite][profileIndex].fields[fieldName] = fieldValue;
  await browser.storage.local.set({ autofillData });

  nameInput.value = "";
  valueInput.value = "";
  renderProfiles();
}

async function deleteProfile(e: Event): Promise<void> {
  const button = e.currentTarget as HTMLButtonElement;
  const profileIndex = Number.parseInt(button.dataset.profile || "", 10);

  if (Number.isNaN(profileIndex) || !currentSite) {
    console.error("Índice de perfil inválido");
    return;
  }

  if (!autofillData[currentSite]?.[profileIndex]) {
    console.error("Perfil não encontrado:", currentSite, profileIndex);
    await loadData();
    renderProfiles();
    return;
  }

  const profileName = autofillData[currentSite][profileIndex].name;

  const confirmed = await showConfirm(`Excluir o perfil "${profileName}"?`, "Excluir perfil", "fa-trash");
  if (confirmed) {
    autofillData[currentSite].splice(profileIndex, 1);

    // Limpar e reorganizar as configurações de auto-fill para este site
    const oldSettings: AutoFillSettings = {};
    Object.keys(autoFillSettings).forEach((key) => {
      if (key.startsWith(`${currentSite}_`)) {
        const idx = Number.parseInt(key.split("_").pop() || "", 10);
        if (idx > profileIndex) {
          // Decrementar o índice dos perfis que vêm depois
          oldSettings[`${currentSite}_${idx - 1}`] = autoFillSettings[key];
        } else if (idx < profileIndex) {
          // Manter os perfis anteriores
          oldSettings[key] = autoFillSettings[key];
        }
        // Remover o perfil excluído (idx === profileIndex)
        delete autoFillSettings[key];
      } else {
        oldSettings[key] = autoFillSettings[key];
      }
    });
    Object.assign(autoFillSettings, oldSettings);

    if (autofillData[currentSite].length === 0) {
      delete autofillData[currentSite];
    }

    await browser.storage.local.set({ autofillData, autoFillSettings });

    const emptyState = document.getElementById("empty-state");
    const siteDetails = document.getElementById("site-details");

    if (!autofillData[currentSite]) {
      if (siteDetails) siteDetails.style.display = "none";
      if (emptyState) emptyState.style.display = "block";
    }

    renderSitesList();
  }
}

function showLinkModal(): void {
  const modal = document.getElementById("link-modal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
  renderLinkedSites();
}

function renderLinkedSites(): void {
  const container = document.getElementById("linked-sites");
  if (!(container && currentSite)) {
    return;
  }

  const linkedSites = siteLinks[currentSite] || [];

  if (linkedSites.length === 0) {
    container.innerHTML =
      '<p class="text-slate-400 text-sm mb-4 flex items-center gap-2"><i class="fas fa-info-circle"></i>Nenhum site vinculado</p>';
    return;
  }

  container.innerHTML = linkedSites
    .map(
      (site) => `
    <div class="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
      <div class="flex items-center gap-2 text-slate-700">
        <i class="fas fa-link text-blue-600"></i>
        <span class="font-medium">${site}</span>
      </div>
      <button class="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors duration-200 w-10 remove-link" data-site="${site}">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `,
    )
    .join("");

  document.querySelectorAll(".remove-link").forEach((btn) => {
    btn.addEventListener("click", removeLinkedSite);
  });
}

async function addLinkedSite(): Promise<void> {
  const input = document.getElementById("new-link-url") as HTMLInputElement;
  if (!(input && currentSite)) {
    return;
  }

  const url = input.value.trim();

  if (!url) {
    await showAlert("Digite uma URL válida", "URL necessária", "fa-exclamation-circle", "warning");
    return;
  }

  try {
    const urlObj = new URL(url);
    const origin = urlObj.origin;

    if (origin === currentSite) {
      await showAlert("Não é possível vincular o site a ele mesmo", "Operação inválida", "fa-ban", "error");
      return;
    }

    if (!siteLinks[currentSite]) {
      siteLinks[currentSite] = [];
    }

    if (siteLinks[currentSite].includes(origin)) {
      await showAlert("Este site já está vinculado", "Site duplicado", "fa-exclamation-circle", "warning");
      return;
    }

    siteLinks[currentSite].push(origin);
    await browser.storage.local.set({ siteLinks });

    input.value = "";
    renderLinkedSites();
  } catch {
    await showAlert("URL inválida", "Erro de validação", "fa-times-circle", "error");
  }
}

async function removeLinkedSite(e: Event): Promise<void> {
  const button = e.currentTarget as HTMLButtonElement;
  const site = button.dataset.site;

  if (!(site && currentSite)) {
    return;
  }

  const confirmed = await showConfirm(`Remover vínculo com ${site}?`, "Remover vínculo", "fa-unlink");
  if (confirmed) {
    siteLinks[currentSite] = siteLinks[currentSite].filter((s) => s !== site);

    if (siteLinks[currentSite].length === 0) {
      delete siteLinks[currentSite];
    }

    await browser.storage.local.set({ siteLinks });
    renderLinkedSites();
  }
}

// Exportar dados
async function exportData(): Promise<void> {
  try {
    const data = await browser.storage.local.get([
      "autofillData",
      "siteLinks",
      "autoFillSettings",
      "showNotifications",
    ]);

    const exportObj: ExportData = {
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      data: {
        autofillData: data.autofillData || {},
        siteLinks: data.siteLinks || {},
        autoFillSettings: data.autoFillSettings || {},
        showNotifications: data.showNotifications,
      },
    };

    const jsonString = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `smart-autofill-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    await showAlert(
      `Dados exportados com sucesso!\n<span class="font-semibold">${a.download}</span>`,
      "Exportação concluída",
      "fa-check-circle",
      "success",
    );
  } catch {
    await showAlert("Erro ao exportar dados", "Erro", "fa-times-circle", "error");
  }
}

// Importar dados
async function importData(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const importObj: ExportData = JSON.parse(text);

    // Validar estrutura
    if (!importObj.data) {
      throw new Error("Formato de arquivo inválido");
    }

    const confirmed = await showConfirm(
      "Isso substituirá todos os seus dados atuais. Deseja continuar?",
      "Confirmar importação",
      "fa-exclamation-triangle",
    );

    if (!confirmed) {
      input.value = "";
      return;
    }

    // Importar dados
    await browser.storage.local.set({
      autofillData: importObj.data.autofillData || {},
      siteLinks: importObj.data.siteLinks || {},
      autoFillSettings: importObj.data.autoFillSettings || {},
      showNotifications: importObj.data.showNotifications,
    });

    // Recarregar dados
    await loadData();
    renderSitesList();

    await showAlert("Dados importados com sucesso!", "Importação concluída", "fa-check-circle", "success");
  } catch (error) {
    console.error("Erro ao importar dados:", error);
    await showAlert("Erro ao importar dados. Verifique se o arquivo é válido.", "Erro", "fa-times-circle", "error");
  } finally {
    input.value = "";
  }
}
