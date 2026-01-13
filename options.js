let currentSite = null;
let autofillData = {};
let siteLinks = {};
let autoFillSettings = {};

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  renderSitesList();

  // Modal controls
  const modal = document.getElementById('link-modal');
  const closeBtn = document.querySelector('.close');
  const linkSitesBtn = document.getElementById('link-sites-btn');
  const addLinkBtn = document.getElementById('add-link-btn');

  linkSitesBtn.addEventListener('click', () => {
    showLinkModal();
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  });

  addLinkBtn.addEventListener('click', addLinkedSite);

  document.getElementById('new-link-url').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addLinkedSite();
    }
  });
});

async function loadData() {
  const data = await browser.storage.local.get(['autofillData', 'siteLinks', 'autoFillSettings']);
  autofillData = data.autofillData || {};
  siteLinks = data.siteLinks || {};
  autoFillSettings = data.autoFillSettings || {};
}

function renderSitesList() {
  const sitesList = document.getElementById('sites-list');
  const sites = Object.keys(autofillData);

  if (sites.length === 0) {
    sitesList.innerHTML = '<p class="text-slate-400 text-sm text-center py-4"><i class="fas fa-inbox mr-2"></i>Nenhum site salvo ainda</p>';
    return;
  }

  sitesList.innerHTML = sites.map(site => `
    <div class="site-item-card group cursor-pointer bg-slate-50 hover:bg-blue-50 border-l-4 border-transparent hover:border-blue-600 rounded-lg p-3 transition-all duration-200" data-site="${site}">
      <div class="flex items-start gap-2">
        <i class="fas fa-globe text-slate-400 group-hover:text-blue-600 mt-1 transition-colors"></i>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-slate-700 group-hover:text-blue-600 truncate transition-colors">${site}</div>
          <div class="text-xs text-slate-500 mt-1">
            <i class="fas fa-users mr-1"></i>${autofillData[site].length} perfil(is)
          </div>
        </div>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.site-item-card').forEach((item) => {
    item.addEventListener('click', () => selectSite(item.dataset.site));
  });

  selectSite();
}

function selectSite(site = currentSite) {
  if (!site) {
    return;
  }

  currentSite = site;
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('site-details').style.display = 'block';
  document.getElementById('site-name').textContent = site;

  const item = document.querySelector(`[data-site="${site}"]`);
  document.querySelectorAll('.site-item-card').forEach((i) => {
    i.classList.remove('!bg-blue-100', '!border-blue-600', 'active');
  });
  item.classList.add('!bg-blue-100', '!border-blue-600', 'active');

  renderProfiles();
}

function renderProfiles() {
  const container = document.getElementById('profiles-container');
  const profiles = autofillData[currentSite] || [];

  container.innerHTML = profiles.map((profile, profileIndex) => {    // Validar se o perfil existe
    if (!profile || !profile.fields) {
      return '';
    }
        const settingKey = `${currentSite}_${profileIndex}`;
    const isAutoFill = autoFillSettings[settingKey] || false;
    return `
    <div class="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden" data-profile="${profileIndex}">
      <div class="bg-gradient-to-r from-white to-slate-50 px-6 py-4 flex justify-between items-center border-b border-slate-200">
        <div class="flex items-center gap-3">
          <div class="bg-blue-600 p-2 rounded-lg">
            <i class="fas fa-user text-white"></i>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-slate-800">${profile.name}</h3>
            <label class="flex items-center gap-2 mt-2 cursor-pointer group">
              <input type="checkbox" class="auto-fill-checkbox w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer" data-profile="${profileIndex}" ${isAutoFill ? 'checked' : ''}>
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
        ${Object.entries(profile.fields).map(([fieldName, fieldValue]) => {
          const isPasswordField = /password|senha|pass|pwd/i.test(fieldName);
          const inputType = isPasswordField ? 'password' : 'text';
          return `
          <div class="grid grid-cols-[200px_1fr_auto] gap-3 items-center bg-slate-50 p-3 rounded-lg" data-field="${fieldName}">
            <div class="flex items-center gap-2 font-medium text-slate-700">
              <i class="fas fa-tag text-slate-400 text-sm"></i>
              <span class="truncate">${fieldName}</span>
            </div>
            <div class="relative flex-1">
              <input type="${inputType}" class="field-value w-full px-4 py-2 ${isPasswordField ? 'pr-10' : ''} border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" value="${fieldValue}" data-field="${fieldName}" data-profile="${profileIndex}">
              ${isPasswordField ? `
              <button type="button" class="toggle-password absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors w-7 p-1" data-field="${fieldName}" data-profile="${profileIndex}">
                <i class="fas fa-eye"></i>
              </button>
              ` : ''}
            </div>
            <button class="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors duration-200 delete-field w-10" data-field="${fieldName}" data-profile="${profileIndex}">
              <i class="fas fa-times"></i>
            </button>
          </div>
        `;
        }).join('')}
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
  }).filter((html) => html !== '').join('');

  // Event listeners para auto-fill checkbox
  document.querySelectorAll('.auto-fill-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', toggleAutoFill);
  });

  // Event listeners para toggle de visualização de senha
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', togglePasswordVisibility);
  });

  // Event listeners para alteração de valores
  document.querySelectorAll('.field-value').forEach(input => {
    input.addEventListener('change', updateFieldValue);
  });

  // Event listeners para exclusão de campos
  document.querySelectorAll('.delete-field').forEach(btn => {
    btn.addEventListener('click', deleteField);
  });

  // Event listeners para adicionar campos
  document.querySelectorAll('.add-field-btn').forEach(btn => {
    btn.addEventListener('click', addField);
  });

  // Event listeners para excluir perfil
  document.querySelectorAll('.delete-profile').forEach(btn => {
    btn.addEventListener('click', deleteProfile);
  });
}

function togglePasswordVisibility(e) {
  e.preventDefault();
  e.stopPropagation();

  const button = e.currentTarget;
  const icon = button.querySelector('i');
  const container = button.closest('.relative');
  const input = container.querySelector('.field-value');

  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}

async function toggleAutoFill(e) {
  const profileIndex = parseInt(e.currentTarget.dataset.profile);

  if (isNaN(profileIndex)) {
    console.error('Índice de perfil inválido');
    return;
  }

  const settingKey = `${currentSite}_${profileIndex}`;

  if (e.currentTarget.checked) {
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

async function updateFieldValue(e) {
  const profileIndex = parseInt(e.currentTarget.dataset.profile);
  const fieldName = e.currentTarget.dataset.field;
  const newValue = e.currentTarget.value;

  if (isNaN(profileIndex)) {
    console.error('Índice de perfil inválido');
    return;
  }

  if (!autofillData[currentSite] || !autofillData[currentSite][profileIndex]) {
    console.error('Perfil não encontrado:', currentSite, profileIndex);
    await loadData();
    renderProfiles();
    return;
  }

  autofillData[currentSite][profileIndex].fields[fieldName] = newValue;
  await browser.storage.local.set({ autofillData });
}

async function deleteField(e) {
  const profileIndex = parseInt(e.currentTarget.dataset.profile);
  const fieldName = e.currentTarget.dataset.field;

  if (isNaN(profileIndex)) {
    console.error('Índice de perfil inválido');
    return;
  }

  if (!autofillData[currentSite] || !autofillData[currentSite][profileIndex]) {
    console.error('Perfil não encontrado:', currentSite, profileIndex);
    await loadData();
    renderProfiles();
    return;
  }

  if (confirm(`Excluir o campo "${fieldName}"?`)) {
    delete autofillData[currentSite][profileIndex].fields[fieldName];
    await browser.storage.local.set({ autofillData });
    renderProfiles();
  }
}

async function addField(e) {
  const profileIndex = parseInt(e.currentTarget.dataset.profile);

  if (isNaN(profileIndex)) {
    console.error('Índice de perfil inválido');
    return;
  }

  const card = e.currentTarget.closest('div[data-profile]');

  if (!card) {
    console.error('Card do perfil não encontrado');
    return;
  }

  const nameInput = card.querySelector('.new-field-name');
  const valueInput = card.querySelector('.new-field-value');

  const fieldName = nameInput.value.trim();
  const fieldValue = valueInput.value.trim();

  if (!fieldName) {
    alert('Digite o nome do campo');
    return;
  }

  if (!autofillData[currentSite] || !autofillData[currentSite][profileIndex]) {
    console.error('Perfil não encontrado:', currentSite, profileIndex);
    await loadData();
    renderProfiles();
    return;
  }

  autofillData[currentSite][profileIndex].fields[fieldName] = fieldValue;
  await browser.storage.local.set({ autofillData });

  nameInput.value = '';
  valueInput.value = '';
  renderProfiles();
}

async function deleteProfile(e) {
  const profileIndex = parseInt(e.currentTarget.dataset.profile);

  if (isNaN(profileIndex)) {
    console.error('Índice de perfil inválido');
    return;
  }

  // Validar se o perfil existe
  if (!autofillData[currentSite] || !autofillData[currentSite][profileIndex]) {
    console.error('Perfil não encontrado:', currentSite, profileIndex);
    await loadData(); // Recarregar dados
    renderProfiles(); // Re-renderizar
    return;
  }

  const profileName = autofillData[currentSite][profileIndex].name;

  if (confirm(`Excluir o perfil "${profileName}"?`)) {
    autofillData[currentSite].splice(profileIndex, 1);

    // Limpar e reorganizar as configurações de auto-fill para este site
    const oldSettings = {};
    Object.keys(autoFillSettings).forEach(key => {
      if (key.startsWith(`${currentSite}_`)) {
        const idx = parseInt(key.split('_').pop());
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

    if (!autofillData[currentSite]) {
      document.getElementById('site-details').style.display = 'none';
      document.getElementById('empty-state').style.display = 'block';
    }

    renderSitesList();
  }
}

function showLinkModal() {
  const modal = document.getElementById('link-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  renderLinkedSites();
}

function renderLinkedSites() {
  const container = document.getElementById('linked-sites');
  const linkedSites = siteLinks[currentSite] || [];

  if (linkedSites.length === 0) {
    container.innerHTML = '<p class="text-slate-400 text-sm mb-4 flex items-center gap-2"><i class="fas fa-info-circle"></i>Nenhum site vinculado</p>';
    return;
  }

  container.innerHTML = linkedSites.map(site => `
    <div class="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
      <div class="flex items-center gap-2 text-slate-700">
        <i class="fas fa-link text-blue-600"></i>
        <span class="font-medium">${site}</span>
      </div>
      <button class="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors duration-200 w-10 remove-link" data-site="${site}">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `).join('');

  document.querySelectorAll('.remove-link').forEach(btn => {
    btn.addEventListener('click', removeLinkedSite);
  });
}

async function addLinkedSite() {
  const input = document.getElementById('new-link-url');
  const url = input.value.trim();

  if (!url) {
    alert('Digite uma URL válida');
    return;
  }

  try {
    const urlObj = new URL(url);
    const origin = urlObj.origin;

    if (origin === currentSite) {
      alert('Não é possível vincular o site a ele mesmo');
      return;
    }

    if (!siteLinks[currentSite]) {
      siteLinks[currentSite] = [];
    }

    if (siteLinks[currentSite].includes(origin)) {
      alert('Este site já está vinculado');
      return;
    }

    siteLinks[currentSite].push(origin);
    await browser.storage.local.set({ siteLinks });

    input.value = '';
    renderLinkedSites();
  } catch (error) {
    alert('URL inválida');
  }
}

async function removeLinkedSite(e) {
  const site = e.currentTarget.dataset.site;

  if (confirm(`Remover vínculo com ${site}?`)) {
    siteLinks[currentSite] = siteLinks[currentSite].filter(s => s !== site);

    if (siteLinks[currentSite].length === 0) {
      delete siteLinks[currentSite];
    }

    await browser.storage.local.set({ siteLinks });
    renderLinkedSites();
  }
}