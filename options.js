let currentSite = null;
let autofillData = {};
let siteLinks = {};

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  renderSitesList();

  // Modal controls
  const modal = document.getElementById('linkModal');
  const closeBtn = document.querySelector('.close');
  const linkSitesBtn = document.getElementById('linkSitesBtn');
  const addLinkBtn = document.getElementById('addLinkBtn');

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

  document.getElementById('newLinkUrl').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addLinkedSite();
    }
  });
});

async function loadData() {
  const data = await browser.storage.local.get(['autofillData', 'siteLinks']);
  autofillData = data.autofillData || {};
  siteLinks = data.siteLinks || {};
}

function renderSitesList() {
  const sitesList = document.getElementById('sitesList');
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

  document.querySelectorAll('.site-item-card').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.site-item-card').forEach(i => {
        i.classList.remove('!bg-blue-100', '!border-blue-600');
      });
      item.classList.add('!bg-blue-100', '!border-blue-600');
      selectSite(item.dataset.site);
    });
  });
}

function selectSite(site) {
  currentSite = site;
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('siteDetails').style.display = 'block';
  document.getElementById('siteName').textContent = site;

  renderProfiles();
}

function renderProfiles() {
  const container = document.getElementById('profilesContainer');
  const profiles = autofillData[currentSite] || [];

  container.innerHTML = profiles.map((profile, profileIndex) => `
    <div class="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden" data-profile="${profileIndex}">
      <div class="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 flex justify-between items-center border-b border-slate-200">
        <div class="flex items-center gap-3">
          <div class="bg-blue-600 p-2 rounded-lg">
            <i class="fas fa-user text-white"></i>
          </div>
          <h3 class="text-lg font-bold text-slate-800">${profile.name}</h3>
        </div>
        <button class="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2 delete-profile" data-profile="${profileIndex}">
          <i class="fas fa-trash"></i>
          <span>Excluir Perfil</span>
        </button>
      </div>

      <div class="p-6 space-y-3" data-profile="${profileIndex}">
        ${Object.entries(profile.fields).map(([fieldName, fieldValue]) => `
          <div class="grid grid-cols-[200px_1fr_auto] gap-3 items-center bg-slate-50 p-3 rounded-lg" data-field="${fieldName}">
            <div class="flex items-center gap-2 font-medium text-slate-700">
              <i class="fas fa-tag text-slate-400 text-sm"></i>
              <span class="truncate">${fieldName}</span>
            </div>
            <input type="text" class="field-value px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" value="${fieldValue}" data-field="${fieldName}" data-profile="${profileIndex}">
            <button class="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors duration-200 delete-field w-10" data-field="${fieldName}" data-profile="${profileIndex}">
              <i class="fas fa-times"></i>
            </button>
          </div>
        `).join('')}
      </div>

      <div class="bg-slate-50 px-6 py-4 border-t border-slate-200">
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
  `).join('');

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

async function updateFieldValue(e) {
  const profileIndex = parseInt(e.target.dataset.profile);
  const fieldName = e.target.dataset.field;
  const newValue = e.target.value;

  autofillData[currentSite][profileIndex].fields[fieldName] = newValue;
  await browser.storage.local.set({ autofillData });
}

async function deleteField(e) {
  const profileIndex = parseInt(e.target.dataset.profile);
  const fieldName = e.target.dataset.field;

  if (confirm(`Excluir o campo "${fieldName}"?`)) {
    delete autofillData[currentSite][profileIndex].fields[fieldName];
    await browser.storage.local.set({ autofillData });
    renderProfiles();
  }
}

async function addField(e) {
  const profileIndex = parseInt(e.target.dataset.profile);
  const card = e.target.closest('.profile-card');
  const nameInput = card.querySelector('.new-field-name');
  const valueInput = card.querySelector('.new-field-value');

  const fieldName = nameInput.value.trim();
  const fieldValue = valueInput.value.trim();

  if (!fieldName) {
    alert('Digite o nome do campo');
    return;
  }

  autofillData[currentSite][profileIndex].fields[fieldName] = fieldValue;
  await browser.storage.local.set({ autofillData });

  nameInput.value = '';
  valueInput.value = '';
  renderProfiles();
}

async function deleteProfile(e) {
  const profileIndex = parseInt(e.target.dataset.profile);
  const profileName = autofillData[currentSite][profileIndex].name;

  if (confirm(`Excluir o perfil "${profileName}"?`)) {
    autofillData[currentSite].splice(profileIndex, 1);

    if (autofillData[currentSite].length === 0) {
      delete autofillData[currentSite];
    }

    await browser.storage.local.set({ autofillData });

    if (autofillData[currentSite]) {
      renderProfiles();
    } else {
      renderSitesList();
      document.getElementById('siteDetails').style.display = 'none';
      document.getElementById('emptyState').style.display = 'block';
    }
  }
}

function showLinkModal() {
  const modal = document.getElementById('linkModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  renderLinkedSites();
}

function renderLinkedSites() {
  const container = document.getElementById('linkedSites');
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
      <button class="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors duration-200 remove-link" data-site="${site}">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `).join('');

  document.querySelectorAll('.remove-link').forEach(btn => {
    btn.addEventListener('click', removeLinkedSite);
  });
}

async function addLinkedSite() {
  const input = document.getElementById('newLinkUrl');
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
  const site = e.target.dataset.site;

  if (confirm(`Remover vínculo com ${site}?`)) {
    siteLinks[currentSite] = siteLinks[currentSite].filter(s => s !== site);

    if (siteLinks[currentSite].length === 0) {
      delete siteLinks[currentSite];
    }

    await browser.storage.local.set({ siteLinks });
    renderLinkedSites();
  }
}