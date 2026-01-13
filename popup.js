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
  const data = await browser.storage.local.get('autofillData');
  const autofillData = data.autofillData || {};

  // Verificar links de sites
  const links = await browser.storage.local.get('siteLinks');
  const siteLinks = links.siteLinks || {};

  // Encontrar o site principal ou sites vinculados
  let siteData = autofillData[currentUrl] || [];

  // Verificar se há dados vinculados de outros sites
  for (const [primarySite, linkedSites] of Object.entries(siteLinks)) {
    if (linkedSites.includes(currentUrl) && autofillData[primarySite]) {
      siteData = [...siteData, ...autofillData[primarySite]];
    }
  }

  const profilesList = document.getElementById('profilesList');

  if (siteData.length === 0) {
    profilesList.innerHTML = `
      <div class="text-center py-8 bg-white rounded-xl shadow-sm border border-slate-200">
        <i class="fas fa-clipboard text-4xl text-slate-300 mb-3"></i>
        <p class="text-slate-500 text-sm">Nenhum preenchimento salvo para este site</p>
      </div>
    `;
    return;
  }

  profilesList.innerHTML = siteData.map((profile, index) => `
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
  `).join('');

  document.querySelectorAll('.profile-card-item').forEach(item => {
    item.addEventListener('click', () => fillForm(parseInt(item.dataset.index)));
  });
}

async function fillForm(profileIndex) {
  const data = await browser.storage.local.get('autofillData');
  const autofillData = data.autofillData || {};

  // Verificar links de sites
  const links = await browser.storage.local.get('siteLinks');
  const siteLinks = links.siteLinks || {};

  let siteData = autofillData[currentUrl] || [];

  // Verificar se há dados vinculados
  for (const [primarySite, linkedSites] of Object.entries(siteLinks)) {
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

  showMessage('Formulário preenchido com sucesso!', 'success');
}

async function captureForm() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });

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
  const isSuccess = type === 'success';
  const icon = isSuccess ? 'fa-circle-check' : 'fa-circle-exclamation';
  const bgColor = isSuccess ? 'bg-green-50' : 'bg-red-50';
  const borderColor = isSuccess ? 'border-green-500' : 'border-red-500';
  const textColor = isSuccess ? 'text-green-800' : 'text-red-800';
  const iconColor = isSuccess ? 'text-green-600' : 'text-red-600';

  messageEl.innerHTML = `
    <div class="${bgColor} ${textColor} ${borderColor} border-l-4 rounded-lg p-4 shadow-md flex items-center gap-3">
      <i class="fas ${icon} ${iconColor} text-xl"></i>
      <span class="font-medium">${text}</span>
    </div>
  `;
  messageEl.classList.remove('hidden');

  setTimeout(() => {
    messageEl.classList.add('hidden');
  }, 3000);
}