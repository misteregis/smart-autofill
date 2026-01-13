// Content script para capturar e preencher formulários

browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'capture') {
    const fields = captureFormData();
    sendResponse({
      fields: fields,
      url: window.location.href
    });
  } else if (message.action === 'fill') {
    fillFormData(message.fields);
    sendResponse({ success: true });
  }
  return true;
});

function captureFormData() {
  const fields = {};

  // Capturar inputs, textareas e selects
  const inputs = document.querySelectorAll('input:not([type="submit"]):not([type="button"]):not([type="image"]), textarea, select');

  inputs.forEach(input => {
    let identifier = input.name || input.id || input.placeholder || input.type;

    if (!identifier || identifier === 'submit' || identifier === 'button') {
      return;
    }

    let value = '';

    if (input.type === 'checkbox' || input.type === 'radio') {
      value = input.checked ? input.value : '';
    } else if (input.tagName === 'SELECT') {
      value = input.options[input.selectedIndex]?.value || '';
    } else {
      value = input.value;
    }

    if (value) {
      // Criar um identificador único
      const uniqueId = `${input.tagName.toLowerCase()}_${identifier}`;
      fields[uniqueId] = value;
    }
  });

  return fields;
}

function fillFormData(fields) {
  Object.entries(fields).forEach(([identifier, value]) => {
    // Tentar encontrar o campo por diferentes métodos
    const [tagName, ...parts] = identifier.split('_');
    const attr = parts.join('_');

    let element = null;

    // Tentar por name
    element = document.querySelector(`${tagName}[name="${attr}"]`);

    // Tentar por id
    if (!element) {
      element = document.querySelector(`${tagName}[id="${attr}"]`);
    }

    // Tentar por placeholder
    if (!element) {
      element = document.querySelector(`${tagName}[placeholder="${attr}"]`);
    }

    // Tentar por type
    if (!element) {
      element = document.querySelector(`${tagName}[type="${attr}"]`);
    }

    if (element) {
      if (element.type === 'checkbox' || element.type === 'radio') {
        element.checked = value === element.value;
      } else if (element.tagName === 'SELECT') {
        Array.from(element.options).forEach(option => {
          if (option.value === value) {
            option.selected = true;
          }
        });
      } else {
        element.value = value;

        // Disparar eventos para frameworks reativos
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });
}