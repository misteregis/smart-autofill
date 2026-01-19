import ToastService from "./services/toast-service.js";
import type {
  AutoFillSettings,
  AutofillData,
  AutofillProfile,
  ExportData,
  IconType,
  ModalType,
  SiteLinks
} from "./types/index.d.ts";
import { enterKeyListener } from "./utils/key-event-util.js";
import { createElementsFromString } from "./utils/strings-util.js";
import { createSvg } from "./utils/svg-util.js";

let currentSite: string | null = null;

let autofillData: AutofillData = {};
let siteLinks: SiteLinks = {};
let autoFillSettings: AutoFillSettings = {};

const emptyState = document.getElementById("empty-state");
const siteDetails = document.getElementById("site-details");
const iconClasses = ["size-5", "flex-1", "text-white"];
const icons: Record<IconType, SVGElement> = {
  "check-circle": createSvg("check-circle", iconClasses, [640, 640]),
  "exclamation-circle": createSvg("exclamation-circle", iconClasses, [640, 640]),
  "exclamation-triangle": createSvg("exclamation-triangle", iconClasses, [640, 640]),
  "eye-slash": createSvg("eye-slash", ["w-4.5", "h-4"], [640, 640]),
  "info-circle": createSvg("info-circle", iconClasses),
  "times-circle": createSvg("times-circle", iconClasses, [640, 640]),
  ban: createSvg("ban", iconClasses, [640, 640]),
  bolt: createSvg("bolt", "size-3", [640, 640]),
  eye: createSvg("eye", ["w-4.5", "h-4"], [640, 640]),
  globe: createSvg("globe", ["text-slate-400", "group-hover:text-blue-600", "mt-1", "transition-colors"]),
  inbox: createSvg("inbox", "size-3.75", [640, 640]),
  link: createSvg("link", ["text-blue-600", "w-4.5", "h-4"], [640, 640]),
  plus: createSvg("plus", [], [640, 640]),
  tag: createSvg("tag", "size-3.5 text-slate-400", [640, 640]),
  times: createSvg("times", [], [640, 640]),
  trash: createSvg("trash", "size-4", [640, 640]),
  unknown: createSvg("unknown", iconClasses),
  unlink: createSvg("unlink", iconClasses, [640, 640]),
  user: createSvg("user", "size-5 text-white"),
  users: createSvg("users", "size-3.75", [640, 512])
};

function showModal(
  id: string,
  message: string,
  title = "Aviso",
  icon: IconType = "info-circle",
  type: ModalType = "info"
): Promise<boolean> {
  return new Promise((resolve) => {
    const modal = document.getElementById(`${id}-modal`);
    const headerElement = document.getElementById(`${id}-header`);
    const titleElement = document.getElementById(`${id}-title`);
    const messageElement = document.getElementById(`${id}-message`);
    const okBtn = document.getElementById(`${id}-ok`);
    const iconElement = document.getElementById(`${id}-icon`);
    const cancelBtn = document.getElementById(`${id}-cancel`);
    const hasCancel = id === "confirm" && cancelBtn;

    if (!(modal && titleElement && messageElement && okBtn)) {
      resolve(!hasCancel);
      return;
    }

    titleElement.textContent = title;
    messageElement.textContent = "";
    messageElement.appendChild(createElementsFromString(message));

    const newIcon = (icons[icon as keyof typeof icons] || icons.unknown).cloneNode(true);
    iconElement?.firstElementChild?.replaceWith(newIcon);

    if (headerElement) {
      // Definir cores baseado no tipo
      const colors: Record<string, string> = {
        danger: "from-red-500 to-red-600",
        info: "from-blue-500 to-blue-600",
        success: "from-green-500 to-green-600",
        warning: "from-yellow-500 to-yellow-600"
      };

      headerElement.className = `bg-gradient-to-r ${colors[type] || colors.info} px-6 py-5 flex items-center gap-3`;
    }

    modal.classList.remove("hidden");
    modal.classList.add("flex");

    const handleOk = (): void => {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      okBtn.removeEventListener("click", handleOk);
      document.removeEventListener("keydown", handleEscape);
      resolve(true);
    };

    if (cancelBtn) {
      const handleCancel = (): void => {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
        okBtn.removeEventListener("click", handleOk);
        cancelBtn.removeEventListener("click", handleCancel);
        document.removeEventListener("keydown", handleEscape);
        resolve(false);
      };

      cancelBtn.addEventListener("click", handleCancel);
    }

    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === "Escape" || e.key === "Enter") {
        handleOk();
      }
    };

    okBtn.addEventListener("click", handleOk);

    setTimeout(() => okBtn.focus(), 100);

    document.addEventListener("keydown", handleEscape);
  });
}

// Função para mostrar modal de alerta customizado
function showAlert(
  message: string,
  title = "Aviso",
  icon: IconType = "info-circle",
  type: ModalType = "info"
): Promise<boolean> {
  return showModal("alert", message, title, icon, type);
}

// Função para mostrar modal de confirmação customizado
function showConfirm(
  message: string,
  title = "AvisoX",
  icon: IconType = "info-circle",
  type: ModalType = "danger"
): Promise<boolean> {
  return showModal("confirm", message, title, icon, type);
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadData();

  // Carregar preferência de notificações
  const notifSettings = await browser.storage.local.get("showNotifications");
  const showNotifications = notifSettings.showNotifications !== false; // Default: true

  const showNotificationsCheckbox = document.getElementById("show-notifications") as HTMLInputElement;
  if (showNotificationsCheckbox) {
    showNotificationsCheckbox.checked = showNotifications;

    // Listener para mudança na configuração de notificações
    showNotificationsCheckbox.addEventListener("change", async (e) => {
      await browser.storage.local.set({
        showNotifications: (e.target as HTMLInputElement).checked
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

  window.addEventListener("hashchange", () => selectSite());
  window.addEventListener("focus", async () => {
    await loadData();

    showSite(autofillData[currentSite || ""] !== undefined);
  });

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

  enterKeyListener("enter", newLinkUrlInput, addLinkedSite);
});

async function loadData(): Promise<void> {
  const data = await browser.storage.local.get(["autofillData", "siteLinks", "autoFillSettings"]);
  autofillData = data.autofillData || {};
  siteLinks = data.siteLinks || {};
  autoFillSettings = data.autoFillSettings || {};

  renderSitesList();
  renderProfiles();
}

const profileText = (profiles: AutofillProfile[]): string => (profiles.length === 1 ? "perfil" : "perfis");

function renderSitesList(): void {
  const sitesList = document.getElementById("sites-list");
  if (!sitesList) {
    return;
  }

  const sites = Object.keys(autofillData);

  if (sites.length === 0) {
    sitesList.textContent = "";
    const p = document.createElement("p");
    p.className = "flex justify-center items-center text-slate-400 text-sm text-center space-x-2 py-4";
    p.appendChild(icons.inbox.cloneNode(true));
    const text = document.createElement("span");
    text.textContent = "Nenhum site salvo ainda";
    p.appendChild(text);
    sitesList.appendChild(p);
    return;
  }

  sitesList.textContent = "";
  sites.forEach((site) => {
    const div = document.createElement("div");
    div.className =
      "site-item-card group cursor-pointer bg-slate-50 hover:bg-blue-50 border-l-4 border-transparent hover:border-blue-600 rounded-lg p-3 transition-all duration-200";
    div.dataset.site = site;

    const flexDiv = document.createElement("div");
    flexDiv.className = "flex items-start gap-2";

    const contentDiv = document.createElement("div");
    contentDiv.className = "flex-1 min-w-0";

    const siteNameDiv = document.createElement("div");
    siteNameDiv.className = "text-sm font-medium text-slate-700 group-hover:text-blue-600 truncate transition-colors";
    siteNameDiv.textContent = site;

    const statsContainer = document.createElement("div");
    statsContainer.className = "flex justify-between items-center text-xs text-slate-500 mt-1";

    const statsDiv = document.createElement("div");
    statsDiv.className = "flex items-center text-xs text-slate-500 gap-1";
    statsDiv.appendChild(icons.users.cloneNode(true));

    const statsText = document.createElement("span");
    statsText.textContent = `${autofillData[site].length} ${profileText(autofillData[site])}`;
    statsDiv.appendChild(statsText);

    const trashIcon = icons.trash.cloneNode(true) as SVGElement;
    trashIcon.classList.add(
      "!size-3.5",
      "hidden",
      "hover:text-red-500",
      "group-hover:block",
      "transition-colors",
      "delete-site"
    );

    statsContainer.appendChild(statsDiv);
    statsContainer.appendChild(trashIcon);

    contentDiv.appendChild(siteNameDiv);
    contentDiv.appendChild(statsContainer);
    flexDiv.appendChild(icons.globe.cloneNode(true));
    flexDiv.appendChild(contentDiv);
    div.appendChild(flexDiv);
    sitesList.appendChild(div);
  });

  document.querySelectorAll(".site-item-card").forEach((item) => {
    item.addEventListener("click", async (e) => {
      const site = (item as HTMLElement).dataset.site;

      if (site) {
        if ((e.target as HTMLElement)?.closest("svg.delete-site")) {
          const confirmed = await showConfirm(
            `Excluir o site <b>${site}</b>? Todos os perfis salvos para este site serão removidos. Esta ação não pode ser desfeita.`,
            "Excluir site",
            "trash",
            "danger"
          );

          if (confirmed) {
            delete autofillData[site];
            await browser.storage.local.set({ autofillData });
            await loadData();

            if (Object.keys(autofillData).length) {
              ToastService.success(`Site <b>${site}</b> removido com sucesso.`);
            } else {
              ToastService.info(`Nenhum site restante. Adicione novos sites para começar a usar o Smart Autofill.`);
            }

            showSite(false);
          }

          return;
        }

        updateHash(site);
      }
    });
  });

  selectSite();
}

function updateHash(site: string): void {
  window.location.hash = site ? `#${site}` : "";
}

function showSite(show: boolean): void {
  if (emptyState) emptyState.style.display = show ? "none" : "block";
  if (siteDetails) siteDetails.style.display = show ? "block" : "none";
}

function selectSite(site: string | null = null): void {
  const hashSite = window.location.hash.slice(1);

  if (!hashSite || !(hashSite in autofillData)) {
    return;
  }

  if (site && site !== currentSite) {
    updateHash(site);
    return;
  }

  currentSite = hashSite;

  const siteName = document.getElementById("site-name");

  showSite(true);

  if (siteName) siteName.textContent = hashSite;

  const item = document.querySelector(`[data-site="${hashSite}"]`);
  document.querySelectorAll(".site-item-card").forEach((i) => {
    i.classList.remove("!bg-blue-100", "!border-blue-600", "active");
  });
  item?.classList.add("!bg-blue-100", "!border-blue-600", "active");

  renderProfiles();
}

function renderProfiles(): void {
  const container = document.getElementById("profiles-container");

  if (!(container && currentSite)) return;

  const profiles = autofillData[currentSite] || [];

  container.replaceChildren();
  const fragment = document.createDocumentFragment();

  profiles.forEach((profile, profileIndex) => {
    const settingKey = `${currentSite}_${profileIndex}`;
    const isAutoFill = autoFillSettings[settingKey];

    /* CARD */
    const card = document.createElement("div");
    card.className = "bg-white rounded-xl shadow-sm overflow-hidden";
    card.dataset.profile = String(profileIndex);

    /* HEADER */
    const header = document.createElement("div");
    header.className =
      "bg-linear-to-r from-white to-slate-50 px-6 py-4 flex justify-between items-center border-b border-slate-200";

    const left = document.createElement("div");
    left.className = "flex items-center gap-3";

    const iconBox = document.createElement("div");
    iconBox.className = "bg-blue-600 p-2 rounded-lg";
    iconBox.appendChild(icons.user.cloneNode(true));

    const info = document.createElement("div");

    const title = document.createElement("h3");
    title.className = "text-lg font-semibold text-slate-800";
    title.textContent = profile.name;

    const label = document.createElement("label");
    label.className = "flex items-center gap-2 mt-2 cursor-pointer group";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(isAutoFill);
    checkbox.className =
      "auto-fill-checkbox w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer";
    checkbox.dataset.profile = String(profileIndex);
    checkbox.addEventListener("change", toggleAutoFill);

    const boltIcon = icons.bolt.cloneNode(true);
    const textFill = document.createElement("span");
    textFill.textContent = "Ativar preenchimento automático";

    const labelText = document.createElement("span");
    labelText.className =
      "flex items-center text-sm text-slate-600 group-hover:text-blue-600 transition-colors space-x-1";
    labelText.append(boltIcon, textFill);

    label.append(checkbox, labelText);
    info.append(title, label);
    left.append(iconBox, info);

    const deleteProfileBtn = document.createElement("button");
    deleteProfileBtn.className =
      "bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2 delete-profile";
    deleteProfileBtn.dataset.profile = String(profileIndex);

    const trashIcon = icons.trash.cloneNode(true);

    const deleteText = document.createElement("span");
    deleteText.textContent = "Excluir Perfil";

    deleteProfileBtn.append(trashIcon, deleteText);
    deleteProfileBtn.addEventListener("click", deleteProfile);

    header.append(left, deleteProfileBtn);

    /* FIELDS */
    const fieldsWrapper = document.createElement("div");
    fieldsWrapper.className = "p-6 space-y-3";
    fieldsWrapper.dataset.profile = String(profileIndex);

    Object.entries(profile.fields).forEach(([fieldName, fieldValue]) => {
      const isPassword = /password|senha|pass|pwd/i.test(fieldName);

      const row = document.createElement("div");
      row.className = "grid grid-cols-[200px_1fr_auto] gap-3 items-center bg-slate-50 p-3 rounded-lg";
      row.dataset.field = fieldName;

      const labelCol = document.createElement("div");
      labelCol.className = "flex items-center gap-2 font-medium text-slate-700";

      const fieldLabel = document.createElement("span");
      fieldLabel.className = "truncate";
      fieldLabel.textContent = fieldName;

      labelCol.append(icons.tag.cloneNode(true), fieldLabel);

      const inputWrapper = document.createElement("div");
      inputWrapper.className = "relative flex-1";

      const input = document.createElement("input");
      input.type = isPassword ? "password" : "text";
      input.value = fieldValue;
      input.className = `field-value w-full px-4 py-2 ${isPassword ? "pr-10" : ""} border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none`;
      input.dataset.field = fieldName;
      input.dataset.profile = String(profileIndex);
      input.addEventListener("change", updateFieldValue);

      inputWrapper.appendChild(input);

      if (isPassword) {
        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.className =
          "toggle-password absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 w-7 p-1";
        toggleBtn.dataset.field = fieldName;
        toggleBtn.dataset.profile = String(profileIndex);

        toggleBtn.appendChild(icons.eye.cloneNode(true));
        toggleBtn.addEventListener("click", togglePasswordVisibility);

        inputWrapper.appendChild(toggleBtn);
      }

      const deleteFieldBtn = document.createElement("button");
      deleteFieldBtn.className =
        "flex justify-center items-center bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg delete-field size-10";
      deleteFieldBtn.dataset.field = fieldName;
      deleteFieldBtn.dataset.profile = String(profileIndex);

      deleteFieldBtn.appendChild(icons.times.cloneNode(true));
      deleteFieldBtn.addEventListener("click", deleteField);

      row.append(labelCol, inputWrapper, deleteFieldBtn);
      fieldsWrapper.appendChild(row);
    });

    /* FOOTER */
    const footer = document.createElement("div");
    footer.className = "bg-white px-6 py-4 border-t border-slate-200";

    const footerGrid = document.createElement("div");
    footerGrid.className = "grid grid-cols-[200px_1fr_auto] gap-3";

    const newFieldName = document.createElement("input");
    newFieldName.type = "text";
    newFieldName.placeholder = "Nome do campo";
    newFieldName.className = "new-field-name px-4 py-2 border border-slate-300 rounded-lg";
    newFieldName.dataset.profile = String(profileIndex);

    const newFieldValue = document.createElement("input");
    newFieldValue.type = "text";
    newFieldValue.placeholder = "Valor do campo";
    newFieldValue.className = "new-field-value px-4 py-2 border border-slate-300 rounded-lg";
    newFieldValue.dataset.profile = String(profileIndex);

    const addFieldBtn = document.createElement("button");
    addFieldBtn.className =
      "bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 rounded-lg flex items-center gap-2 add-field-btn";
    addFieldBtn.dataset.profile = String(profileIndex);
    addFieldBtn.addEventListener("click", addField);

    const addText = document.createElement("span");
    addText.textContent = "Adicionar";

    addFieldBtn.append(icons.plus.cloneNode(true), addText);

    footerGrid.append(newFieldName, newFieldValue, addFieldBtn);
    footer.appendChild(footerGrid);

    card.append(header, fieldsWrapper, footer);
    fragment.appendChild(card);

    enterKeyListener("enter", [newFieldName, newFieldValue], () => addFieldBtn.click());
  });

  container.appendChild(fragment);
}

function togglePasswordVisibility(e: Event): void {
  e.preventDefault();
  e.stopPropagation();

  const button = e.currentTarget as HTMLButtonElement;
  const icon = button.querySelector("svg");
  const container = button.closest(".relative");
  const input = container?.querySelector(".field-value") as HTMLInputElement;

  if (!(input && icon)) {
    return;
  }

  if (input.type === "password") {
    input.type = "text";
    icon.replaceWith(icons["eye-slash"].cloneNode(true));
  } else {
    input.type = "password";
    icon.replaceWith(icons.eye.cloneNode(true));
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
    return;
  }

  const confirmed = await showConfirm(`Excluir o campo "${fieldName}"?`, "Excluir campo", "trash");
  if (confirmed) {
    delete autofillData[currentSite][profileIndex].fields[fieldName];
    await browser.storage.local.set({ autofillData });
    ToastService.success(`Campo "<b>${fieldName}</b>" excluído com sucesso.`);
    renderProfiles();
  }
}

async function addField(e: Event): Promise<void> {
  const button = e.currentTarget as HTMLButtonElement;
  const profileIndex = Number.parseInt(button.dataset.profile || "", 10);

  if (Number.isNaN(profileIndex) || !currentSite) {
    console.error("Índice de perfil inválido");
    ToastService.error("Erro ao adicionar campo. Tente novamente.");
    return;
  }

  const card = button.closest("div[data-profile]");

  if (!card) {
    console.error("Card do perfil não encontrado");
    ToastService.error("Erro ao adicionar campo. Tente novamente.");
    return;
  }

  const nameInput = card.querySelector(".new-field-name") as HTMLInputElement;
  const valueInput = card.querySelector(".new-field-value") as HTMLInputElement;

  const fieldName = nameInput.value.trim();
  const fieldValue = valueInput.value.trim();

  if (!fieldName) {
    await showAlert("Digite o nome do campo", "Campo obrigatório", "exclamation-circle", "warning");
    return;
  }

  if (!autofillData[currentSite]?.[profileIndex]) {
    console.error("Perfil não encontrado:", currentSite, profileIndex);
    ToastService.error("Erro ao adicionar campo. Tente novamente.");
    await loadData();
    return;
  }

  if (fieldName in autofillData[currentSite][profileIndex].fields) {
    ToastService.warn(`O campo "<b>${fieldName}</b>" já existe neste perfil.`);
  } else {
    autofillData[currentSite][profileIndex].fields[fieldName] = fieldValue;
    await browser.storage.local.set({ autofillData });

    ToastService.success(`Campo "<b>${fieldName}</b>" adicionado com sucesso.`);

    renderProfiles();
  }

  nameInput.value = "";
  valueInput.value = "";
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
    return;
  }

  const profileName = autofillData[currentSite][profileIndex].name;

  const confirmed = await showConfirm(`Excluir o perfil "${profileName}"?`, "Excluir perfil", "trash");
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

      ToastService.show("Nenhum perfil restante para este site. O site foi removido da lista.", "info");
    } else {
      ToastService.success(`Perfil "${profileName}" excluído com sucesso.`);
    }

    await browser.storage.local.set({ autofillData, autoFillSettings });

    if (!autofillData[currentSite]) {
      showSite(false);
    }

    await loadData();
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
    container.textContent = "";
    const p = document.createElement("p");
    const infoIcon = icons["info-circle"].cloneNode(true) as SVGSVGElement;
    infoIcon.classList.remove("size-5", "flex-1", "text-white");
    infoIcon.classList.add("size-3.5");
    p.className = "text-slate-400 text-sm mb-4 flex items-center gap-2";
    p.appendChild(infoIcon);
    p.appendChild(document.createTextNode("Nenhum site vinculado"));
    container.appendChild(p);
    return;
  }

  container.textContent = "";
  linkedSites.forEach((site) => {
    const div = document.createElement("div");
    div.className = "flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200";

    const leftDiv = document.createElement("div");
    leftDiv.className = "flex items-center gap-2 text-slate-700";

    const span = document.createElement("span");
    span.className = "font-medium";
    span.textContent = site;

    leftDiv.appendChild(icons.link.cloneNode(true));
    leftDiv.appendChild(span);

    const button = document.createElement("button");
    button.className =
      "flex justify-center items-center bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors duration-200 size-10 remove-link";
    button.dataset.site = site;

    const btnIcon = icons.times.cloneNode(true);
    button.appendChild(btnIcon);

    div.appendChild(leftDiv);
    div.appendChild(button);
    container.appendChild(div);
  });

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
    await showAlert("Digite uma URL válida", "URL necessária", "exclamation-circle", "warning");
    return;
  }

  try {
    const urlObj = new URL(url);
    const origin = urlObj.origin;

    if (origin === currentSite) {
      await showAlert("Não é possível vincular o site a ele mesmo", "Operação inválida", "ban", "danger");
      return;
    }

    if (!siteLinks[currentSite]) {
      siteLinks[currentSite] = [];
    }

    if (siteLinks[currentSite].includes(origin)) {
      await showAlert("Este site já está vinculado", "Site duplicado", "exclamation-circle", "warning");
      return;
    }

    siteLinks[currentSite].push(origin);
    await browser.storage.local.set({ siteLinks });

    input.value = "";
    renderLinkedSites();
  } catch {
    await showAlert("URL inválida", "Erro de validação", "times-circle", "danger");
  }
}

async function removeLinkedSite(e: Event): Promise<void> {
  const button = e.currentTarget as HTMLButtonElement;
  const site = button.dataset.site;

  if (!(site && currentSite)) {
    return;
  }

  const confirmed = await showConfirm(
    `Remover vínculo:\n<span class="font-semibold">${site}</span>`,
    "Remover vínculo",
    "unlink"
  );
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
      "showNotifications"
    ]);

    const exportObj: ExportData = {
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      data: {
        autofillData: data.autofillData || {},
        siteLinks: data.siteLinks || {},
        autoFillSettings: data.autoFillSettings || {},
        showNotifications: data.showNotifications
      }
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
      "check-circle",
      "success"
    );
  } catch {
    await showAlert("Erro ao exportar dados", "Erro", "times-circle", "danger");
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
      "exclamation-triangle",
      "warning"
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
      showNotifications: importObj.data.showNotifications
    });

    // Recarregar dados
    await loadData();

    await showAlert("Dados importados com sucesso!", "Importação concluída", "check-circle", "success");
  } catch (error) {
    console.error("Erro ao importar dados:", error);
    await showAlert("Erro ao importar dados. Verifique se o arquivo é válido.", "Erro", "times-circle", "danger");
  } finally {
    input.value = "";
  }
}
