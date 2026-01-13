let currentUrl = '';

document.addEventListener('DOMContentLoaded', async () => {
  // Get current tab URL
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  currentUrl = new URL(tabs[0].url).origin;
  
  document.getElementById('currentSite').textContent = `Site atual: ${currentUrl}`;
  
  loadProfiles();
  
  document.getElementById('captureBtn').addEventListener('click', captureForm);
  document.getElementById('optionsBtn').addEventListener('click', () => {
    browser.runtime.openOptionsPage();
  });
});

async function loadProfiles() {
  const data = await browser.storage.local. get('autofillData');
  const autofillData = data.autofillData || {};
  
  // Verificar links de sites
  const links = await browser.storage.local.get('siteLinks');
  const siteLinks = links.siteLinks || {};
  
  // Encontrar o site principal ou sites vinculados
  let siteData = autofillData[currentUrl] || [];
  
  // Verificar se há dados vinculados de outros sites
  for (const [primarySite, linkedSites] of Object.entries(siteLinks)) {
    if (linkedSites.includes(currentUrl) && autofillData[primarySite]) {
      siteData = [... siteData, ...autofillData[primarySite]];
    }
  }
  
  const profilesList = document.getElementById('profilesList');
  
  if (siteData.length === 0) {
    profilesList. innerHTML = `
      <div class="empty-state">
        <div>📝</div>
        <p>Nenhum preenchimento salvo para este site</p>
      </div>
    `;
    return;
  }
  
  profilesList.innerHTML = siteData.map((profile, index) => `
    <div class="profile-item" data-index="${index}">
      <div class="profile-name">${profile.name || `Perfil ${index + 1}`}</div>
      <div class="profile-fields">${Object.keys(profile. fields).length} campos</div>
    </div>
  `).join('');
  
  document.querySelectorAll('.profile-item').forEach(item => {
    item.addEventListener('click', () => fillForm(parseInt(item.dataset.index)));
  });
}

async function fillForm(profileIndex) {
  const data = await browser.storage.local. get('autofillData');
  const autofillData = data.autofillData || {};
  
  // Verificar links de sites
  const links = await browser.storage.local.get('siteLinks');
  const siteLinks = links.siteLinks || {};
  
  let siteData = autofillData[currentUrl] || [];
  
  // Verificar se há dados vinculados
  for (const [primarySite, linkedSites] of Object. entries(siteLinks)) {
    if (linkedSites.includes(currentUrl) && autofillData[primarySite]) {
      siteData = [...siteData, ...autofillData[primarySite]];
    }
  }
  
  const profile = siteData[profileIndex];
  
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  await browser.tabs.sendMessage(tabs[0].id, {
    action: 'fill',
    fields: profile.fields
  });
  
  showMessage('Formulário preenchido com sucesso! ', 'success');
}

async function captureForm() {
  const tabs = await browser.tabs. query({ active: true, currentWindow: true });
  
  try {
    const response = await browser.tabs.sendMessage(tabs[0].id, {
      action: 'capture'
    });
    
    if (response && response.fields && Object.keys(response.fields).length > 0) {
      const profileName = prompt('Nome deste preenchimento:', `Perfil ${new Date().toLocaleString('pt-BR')}`);
      
      if (profileName) {
        const data = await browser.storage.local.get('autofillData');
        const autofillData = data.autofillData || {};
        
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
        
        showMessage('Preenchimento capturado com sucesso!', 'success');
        loadProfiles();
      }
    } else {
      showMessage('Nenhum campo de formulário encontrado na página', 'error');
    }
  } catch (error) {
    showMessage('Erro ao capturar formulário:  ' + error.message, 'error');
  }
}

function showMessage(text, type) {
  const messageEl = document.getElementById('message');
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  
  setTimeout(() => {
    messageEl.style.display = 'none';
  }, 3000);
}