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
    modal.style.display = 'none';
  });
  
  window.addEventListener('click', (e) => {
    if (e. target === modal) {
      modal.style.display = 'none';
    }
  });
  
  addLinkBtn. addEventListener('click', addLinkedSite);
  
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
    sitesList.innerHTML = '<p style="color: #999; font-size: 13px;">Nenhum site salvo ainda</p>';
    return;
  }
  
  sitesList.innerHTML = sites.map(site => `
    <div class="site-item" data-site="${site}">
      <div class="site-url">${site}</div>
      <div class="site-count">${autofillData[site].length} perfil(is)</div>
    </div>
  `).join('');
  
  document.querySelectorAll('.site-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.site-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
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
    <div class="profile-card" data-profile="${profileIndex}">
      <div class="profile-header">
        <div class="profile-title">${profile.name}</div>
        <div class="profile-actions">
          <button class="btn btn-danger btn-small delete-profile" data-profile="${profileIndex}">
            🗑️ Excluir Perfil
          </button>
        </div>
      </div>
      
      <div class="fields-list" data-profile="${profileIndex}">
        ${Object.entries(profile.fields).map(([fieldName, fieldValue]) => `
          <div class="field-item" data-field="${fieldName}">
            <div class="field-name">${fieldName}</div>
            <input type="text" class="field-value" value="${fieldValue}" data-field="${fieldName}" data-profile="${profileIndex}">
            <button class="btn btn-danger btn-small delete-field" data-field="${fieldName}" data-profile="${profileIndex}">
              ❌
            </button>
          </div>
        `).join('')}
      </div>
      
      <div class="add-field">
        <input type="text" class="new-field-name" placeholder="Nome do campo" data-profile="${profileIndex}">
        <input type="text" class="new-field-value" placeholder="Valor do campo" data-profile="${profileIndex}">
        <button class="btn btn-primary add-field-btn" data-profile="${profileIndex}">
          ➕ Adicionar Campo
        </button>
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
  const profileIndex = parseInt(e.target. dataset.profile);
  const fieldName = e.target.dataset. field;
  const newValue = e.target.value;
  
  autofillData[currentSite][profileIndex]. fields[fieldName] = newValue;
  await browser.storage.local.set({ autofillData });
}

async function deleteField(e) {
  const profileIndex = parseInt(e.target.dataset.profile);
  const fieldName = e.target.dataset.field;
  
  if (confirm(`Excluir o campo "${fieldName}"?`)) {
    delete autofillData[currentSite][profileIndex].fields[fieldName];
    await browser.storage. local.set({ autofillData });
    renderProfiles();
  }
}

async function addField(e) {
  const profileIndex = parseInt(e.target.dataset.profile);
  const card = e.target.closest('.profile-card');
  const nameInput = card.querySelector('.new-field-name');
  const valueInput = card.querySelector('.new-field-value');
  
  const fieldName = nameInput.value. trim();
  const fieldValue = valueInput.value.trim();
  
  if (! fieldName) {
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
    autofillData[currentSite]. splice(profileIndex, 1);
    
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
  modal.style.display = 'block';
  renderLinkedSites();
}

function renderLinkedSites() {
  const container = document.getElementById('linkedSites');
  const linkedSites = siteLinks[currentSite] || [];
  
  if (linkedSites.length === 0) {
    container.innerHTML = '<p style="color: #999; font-size: 13px; margin-bottom: 10px;">Nenhum site vinculado</p>';
    return;
  }
  
  container.innerHTML = linkedSites. map(site => `
    <div class="linked-site-item">
      <span>${site}</span>
      <button class="btn btn-danger btn-small remove-link" data-site="${site}">❌</button>
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
    
    if (! siteLinks[currentSite]) {
      siteLinks[currentSite] = [];
    }
    
    if (siteLinks[currentSite]. includes(origin)) {
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
  const site = e.target.dataset. site;
  
  if (confirm(`Remover vínculo com ${site}?`)) {
    siteLinks[currentSite] = siteLinks[currentSite].filter(s => s !== site);
    
    if (siteLinks[currentSite].length === 0) {
      delete siteLinks[currentSite];
    }
    
    await browser.storage. local.set({ siteLinks });
    renderLinkedSites();
  }
}