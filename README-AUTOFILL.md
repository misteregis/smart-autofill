# ⚡ Preenchimento Automático - Smart Autofill

## 📋 Funcionalidade de Auto-Fill

A extensão **Smart Autofill** possui um poderoso recurso de **preenchimento automático** que preenche formulários assim que a página carregar, economizando tempo em sites que você acessa frequentemente.

## ✨ Como Usar

### 1️⃣ Configurar Perfil de Preenchimento Automático

1. **Acesse as Configurações:**
   - Clique no ícone da extensão Smart Autofill na barra de ferramentas
   - Clique no botão **"Configurações"** no popup
   - *Ou* clique com o botão direito no ícone e selecione "Opções"

2. **Selecione o Site:**
   - Na coluna esquerda, clique no site para o qual deseja configurar o auto-fill
   - Você verá todos os perfis salvos para aquele site

3. **Ative o Preenchimento Automático:**
   - Cada perfil possui uma checkbox com o ícone de raio:
     ```
     ⚡ Preencher automaticamente ao carregar
     ```
   - Marque a checkbox no perfil que deseja que seja preenchido automaticamente

> **⚠️ Importante:** Apenas **um perfil por site** pode ter o preenchimento automático ativado. Ao marcar uma checkbox, as outras serão automaticamente desmarcadas para o mesmo site.

### 2️⃣ Como Funciona

**Processo Automático:**

1. Quando você visita um site que possui um perfil com auto-fill ativado
2. O content script detecta automaticamente a configuração
3. Após um delay de **500ms** (meio segundo), os campos são preenchidos
4. Eventos `input` e `change` são disparados para compatibilidade com frameworks reativos

**Recursos Técnicos:**

- ✅ **Delay Inteligente**: 500ms garante que a página carregue completamente antes do preenchimento
- ✅ **Sites Vinculados**: Funciona também com sites vinculados ao site principal
- ✅ **Compatibilidade**: Dispara eventos DOM para frameworks JavaScript (React, Vue, Angular)
- ✅ **Suporte Completo**: Funciona com input, textarea, select, checkbox e radio buttons

### 3️⃣ Exemplo Prático de Uso

**Cenário:** Formulário de login que você acessa diariamente

**Passo a Passo:**

1. **Primeira vez - Capturar dados:**
   - Acesse o site de login
   - Preencha usuário e senha
   - Clique no ícone Smart Autofill → "Capturar novo preenchimento"
   - Digite um nome descritivo: "Login Trabalho"
   - Clique em "Salvar"

2. **Configurar auto-fill:**
   - Vá em Configurações
   - Selecione o site na lista à esquerda
   - Encontre o perfil "Login Trabalho"
   - Marque ✅ "⚡ Preencher automaticamente ao carregar"

3. **Aproveite:**
   - Na próxima vez que visitar o site, os campos serão preenchidos automaticamente! 🎉
   - Você só precisa clicar em "Login"

### 4️⃣ Casos de Uso Recomendados

✅ **Ideal para:**
- Formulários de login frequentes
- Painéis administrativos
- Formulários de cadastro em ambientes de desenvolvimento/teste
- Sites internos da empresa
- Aplicações web que você usa diariamente

⚠️ **Evite usar em:**
- Computadores compartilhados
- Sites bancários ou financeiros sensíveis
- Formulários com dados que mudam frequentemente
- Sites públicos em dispositivos de terceiros

## 🔒 Segurança e Privacidade

### Armazenamento Local
- ✅ Todas as configurações ficam armazenadas **localmente** no navegador
- ✅ Utiliza `browser.storage.local` (API oficial do Firefox)
- ✅ **Nenhum dado é enviado para servidores externos**

### Controle Total
- ✅ Você decide quais sites terão auto-fill
- ✅ Você escolhe qual perfil será usado
- ✅ Pode desativar a qualquer momento desmarcando a checkbox
- ✅ Pode excluir perfis e sites quando quiser

### Recomendações de Segurança
- 🔐 Use senhas fortes e únicas para cada site
- 🔐 Considere usar um gerenciador de senhas dedicado para credenciais sensíveis
- 🔐 Desative auto-fill em computadores compartilhados
- 🔐 Revise periodicamente os sites e perfis salvos

## 🔧 Gerenciamento de Auto-Fill

### Visualizar Configurações Ativas

Na página de Configurações, perfis com auto-fill ativado exibem:
- ✅ Checkbox marcada
- ⚡ Ícone de raio destacado
- Indicação visual clara

### Desativar Auto-Fill

**Para um perfil específico:**
1. Vá em Configurações → Selecione o site
2. Desmarque a checkbox "⚡ Preencher automaticamente ao carregar"

**Para todos os perfis:**
- Simplesmente desmarque todas as checkboxes na página de configurações

### Editar Perfil com Auto-Fill

1. Selecione o site na lista à esquerda
2. Clique em "Editar" no perfil desejado
3. Modifique os campos conforme necessário
4. Salve as alterações
5. A configuração de auto-fill permanece ativa

## 🔒 Segurança

## 🛠️ Detalhes Técnicos da Implementação

### Arquivos Modificados

#### 1. [content.ts](src/content.ts)

**Função IIFE de Auto-Fill:**
```typescript
(async function autoFill(): Promise<void> {
  const currentOrigin = window.location.origin;
  const data = await browser.storage.local.get([
    "autofillData",
    "siteLinks",
    "autoFillSettings"
  ]);

  // Busca perfil ativo para o site atual
  // Verifica também sites vinculados
  // Preenche após 500ms se encontrado
})();
```

**Características:**
- Executa automaticamente ao carregar a página
- Busca perfil com auto-fill ativo no site atual
- Verifica sites vinculados se não encontrar no site atual
- Chama `fillFormData()` com delay de 500ms para garantir DOM carregado
- Dispara eventos `input` e `change` para frameworks reativos

**Função de Preenchimento:**
```typescript
function fillFormData(fields: Record<string, string>): void {
  // Procura campos por: name, id, placeholder ou type
  // Suporta: input, textarea, select, checkbox, radio
  // Dispara eventos para compatibilidade com frameworks
}
```

#### 2. [options.ts](src/options.ts)

**Gerenciamento de Auto-Fill Settings:**

- **Variável Global:**
  ```typescript
  let autoFillSettings: AutoFillSettings = {};
  ```

- **Função `toggleAutoFill(site: string, index: number)`:**
  - Gerencia ativação/desativação de auto-fill
  - Garante que apenas um perfil por site seja ativo
  - Formato da chave: `"https://site.com_0"` (site_índiceDoPerfil)
  - Salva no storage automaticamente

- **Renderização:**
  - Adiciona checkbox em cada card de perfil
  - Mostra ícone de raio (⚡) quando ativo
  - Atualiza estado visual em tempo real

**HTML Gerado Dinamicamente:**
```html
<label class="flex items-center gap-2 cursor-pointer">
  <input type="checkbox"
         data-index="0"
         class="autofill-toggle">
  <svg>⚡</svg>
  <span>Preencher automaticamente ao carregar</span>
</label>
```

#### 3. [options.html](src/options.html)

- Interface permanece igual
- Checkboxes são geradas dinamicamente via JavaScript
- Integração visual com Tailwind CSS

### Estrutura de Dados no Storage

#### autoFillSettings

```typescript
interface AutoFillSettings {
  [key: string]: boolean;  // "origin_profileIndex": boolean
}
```

**Exemplo:**
```json
{
  "https://exemplo.com_0": true,
  "https://github.com_1": true,
  "http://localhost:3000_0": true
}
```

**Formato da Chave:** `${origin}_${profileIndex}`
- `origin`: URL de origem do site (ex: `https://github.com`)
- `profileIndex`: Índice do perfil no array (ex: `0`, `1`, `2`)

#### autofillData

```typescript
interface AutofillData {
  [origin: string]: AutofillProfile[];
}

interface AutofillProfile {
  name: string;
  fields: Record<string, string>;
  timestamp?: number;
  url?: string;
  createdAt?: string;
}
```

**Exemplo:**
```json
{
  "https://exemplo.com": [
    {
      "name": "Login Trabalho",
      "fields": {
        "input_username": "usuario@exemplo.com",
        "input_password": "senha123",
        "input_remember": "on"
      },
      "timestamp": 1737331200000,
      "createdAt": "20/01/2026 10:00:00"
    },
    {
      "name": "Login Pessoal",
      "fields": {
        "input_username": "pessoal@email.com",
        "input_password": "outrasenha"
      }
    }
  ]
}
```

#### siteLinks

```typescript
interface SiteLinks {
  [primarySite: string]: string[];
}
```

**Exemplo:**
```json
{
  "https://app.exemplo.com": [
    "http://localhost:3000",
    "https://staging.exemplo.com",
    "https://dev.exemplo.com"
  ]
}
```

**Uso:** Sites vinculados compartilham os mesmos perfis do site principal.

### Fluxo de Execução

```
┌─────────────────────────────────────────────────────┐
│ 1. Usuário acessa o site                            │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ 2. Content Script (content.ts) carrega              │
│    - IIFE autoFill() é executada                    │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ 3. Busca dados no storage                           │
│    - autofillData                                   │
│    - siteLinks                                      │
│    - autoFillSettings                               │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ 4. Verifica se há perfil ativo                      │
│    a) Busca no site atual (currentOrigin)           │
│    b) Se não encontrar, busca em sites vinculados   │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ 5. Se encontrou perfil ativo:                       │
│    - setTimeout(500ms)                              │
│    - fillFormData(profile.fields)                   │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ 6. Preenche campos:                                 │
│    - Procura por name, id, placeholder, type        │
│    - Define value/checked/selected                  │
│    - Dispara eventos input e change                 │
└─────────────────────────────────────────────────────┘
```

### Algoritmo de Busca de Perfil Ativo

```typescript
// 1. Buscar no site atual
for (let i = 0; i < siteData.length; i++) {
  const settingKey = `${currentOrigin}_${i}`;
  if (autoFillSettings[settingKey]) {
    autoFillProfile = siteData[i];
    break;
  }
}

// 2. Se não encontrou, buscar em sites vinculados
if (!autoFillProfile) {
  for (const [primarySite, linkedSites] of Object.entries(siteLinks)) {
    if (linkedSites.includes(currentOrigin) && autofillData[primarySite]) {
      const linkedData = autofillData[primarySite];
      for (let i = 0; i < linkedData.length; i++) {
        const settingKey = `${primarySite}_${i}`;
        if (autoFillSettings[settingKey]) {
          autoFillProfile = linkedData[i];
          break;
        }
      }
    }
  }
}
```

### Estratégia de Identificação de Campos

Os campos são identificados com prioridade:

1. **Por `name` attribute**
   ```typescript
   document.querySelector(`${tagName}[name="${attr}"]`)
   ```

2. **Por `id` attribute**
   ```typescript
   document.querySelector(`${tagName}[id="${attr}"]`)
   ```

3. **Por `placeholder` attribute**
   ```typescript
   document.querySelector(`${tagName}[placeholder="${attr}"]`)
   ```

4. **Por `type` attribute**
   ```typescript
   document.querySelector(`${tagName}[type="${attr}"]`)
   ```

**Formato do Identificador:** `${tagName}_${attribute}`
- Exemplo: `input_username`, `textarea_message`, `select_country`

### Compatibilidade com Frameworks

Para garantir que frameworks JavaScript detectem mudanças:

```typescript
// Disparar eventos após preencher
element.dispatchEvent(new Event("input", { bubbles: true }));
element.dispatchEvent(new Event("change", { bubbles: true }));
```

**Frameworks Suportados:**
- ✅ React
- ✅ Vue.js
- ✅ Angular
- ✅ Svelte
- ✅ Vanilla JavaScript

## 🎯 Boas Práticas de Desenvolvimento

### Adicionando Novos Recursos

1. **Mantenha TypeScript Tipado:**
   ```typescript
   // ✅ Bom
   function toggleAutoFill(site: string, index: number): Promise<void>

   // ❌ Ruim
   function toggleAutoFill(site, index)
   ```

2. **Use Interfaces Definidas:**
   ```typescript
   import type { AutoFillSettings } from "./types/index.d.ts";
   ```

3. **Siga o Padrão de Nomenclatura:**
   - Variáveis: `camelCase`
   - Interfaces: `PascalCase`
   - Constantes: `UPPER_SNAKE_CASE`
   - Arquivos: `kebab-case.ts`

4. **Formate com Biome:**
   ```bash
   pnpm format
   pnpm lint:fix
   ```

### Testando Auto-Fill

**Teste Manual:**

1. Configure um perfil com auto-fill em `http://localhost:8000`
2. Crie uma página HTML de teste:
   ```html
   <form>
     <input name="username" placeholder="Usuário">
     <input name="password" type="password">
     <button type="submit">Login</button>
   </form>
   ```
3. Acesse a página e verifique se preenche após 500ms
4. Teste com diferentes tipos de campo (checkbox, select, etc.)

**Depuração:**

```typescript
// Adicione logs no content.ts
console.log("Auto-fill profile found:", autoFillProfile);
console.log("Fields to fill:", autoFillProfile?.fields);
```

## 📚 Referências

### APIs Firefox Utilizadas

- [browser.storage.local](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/local): Armazenamento local persistente
- [browser.tabs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs): Manipulação de abas
- [browser.runtime](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime): Comunicação entre scripts
- [Content Scripts](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts): Scripts injetados em páginas web

### Documentação Relacionada

- [WebExtensions API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Biome](https://biomejs.dev/)

---

## 💡 Dicas Avançadas

### Compartilhar Perfis Entre Ambientes

Vincule sites de desenvolvimento, staging e produção:

```
Site Principal: https://app.exemplo.com
Sites Vinculados:
  - http://localhost:3000
  - https://staging.exemplo.com
  - https://dev.exemplo.com
```

Todos compartilharão os mesmos perfis!

### Backup de Configurações

1. Exporte dados regularmente via "Exportar dados"
2. Guarde o arquivo JSON em local seguro
3. Use controle de versão se necessário

### Uso em Múltiplos Navegadores

1. Exporte dados do Firefox 1
2. Instale extensão no Firefox 2
3. Importe dados exportados
4. Pronto! Mesmas configurações em ambos

---

**📖 Para mais informações, consulte o [README.md](README.md) principal.**
