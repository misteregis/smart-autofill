# 🚀 Smart Autofill

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Firefox](https://img.shields.io/badge/Firefox-Extension-orange.svg)](https://www.mozilla.org/pt-BR/firefox/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

**Smart Autofill** é uma extensão inteligente para Firefox que permite capturar, salvar e preencher automaticamente formulários web com apenas um clique. Economize tempo e evite repetir digitações em sites que você acessa frequentemente!

## ✨ Funcionalidades

### 🎯 Principais Recursos

- **Captura Automática de Formulários**: Capture todos os campos de um formulário com um único clique
- **Múltiplos Perfis**: Salve diferentes conjuntos de dados para o mesmo site
- **Preenchimento Automático**: Configure perfis para preenchimento automático ao carregar a página
- **Vinculação de Sites**: Compartilhe perfis entre sites relacionados (ex: subdomínios, ambientes de teste/produção)
- **Menu de Contexto**: Acesso rápido via clique direito em campos editáveis
- **Badge Inteligente**: Visualize o número de perfis salvos diretamente no ícone da extensão
- **Importação/Exportação**: Faça backup e transfira suas configurações entre navegadores

### 🔧 Recursos Avançados

- **Sistema de Notificações**: Feedback visual para todas as ações (pode ser desabilitado)
- **Suporte a Diferentes Tipos de Campo**: Input, textarea, select, checkbox e radio buttons
- **Interface Moderna**: Design responsivo com Tailwind CSS
- **Gerenciamento Visual**: Interface completa para gerenciar sites, perfis e configurações
- **TypeScript**: Código totalmente tipado para maior confiabilidade

## 📦 Instalação

### Instalação Manual (Desenvolvimento)

1. Clone o repositório:
```bash
git clone https://github.com/misteregis/smart-autofill.git
cd smart-autofill
```

2. Instale as dependências:
```bash
pnpm install
```

3. Compile o projeto:
```bash
pnpm build
```

4. Carregue a extensão no Firefox:
   - Acesse `about:debugging#/runtime/this-firefox`
   - Clique em "Carregar extensão temporária..."
   - Selecione o arquivo `manifest.json` na pasta `dist/`

### Instalação via Pacote

1. Execute o comando de build:
```bash
pnpm web:build
```

2. O arquivo `.xpi` será gerado em `web-ext-artifacts/`
3. Arraste o arquivo para o Firefox ou instale via `about:addons`

## 🎮 Como Usar

### 1️⃣ Capturando um Formulário

**Via Popup:**
1. Preencha os campos do formulário no site
2. Clique no ícone do Smart Autofill na barra de ferramentas
3. Clique em "Capturar novo preenchimento"
4. Digite um nome descritivo para o perfil
5. Pronto! Os dados foram salvos

**Via Menu de Contexto:**
1. Preencha o formulário
2. Clique com o botão direito em qualquer campo editável
3. Selecione "Smart Autofill" → "➕ Criar novo perfil"

### 2️⃣ Preenchendo um Formulário

**Via Popup:**
1. Acesse o site onde deseja preencher
2. Clique no ícone do Smart Autofill
3. Selecione o perfil desejado na lista

**Via Menu de Contexto:**
1. Clique com o botão direito em qualquer campo
2. Selecione "Smart Autofill" → perfil desejado

### 3️⃣ Preenchimento Automático

1. Clique no ícone do Smart Autofill e vá em "Configurações"
2. Selecione o site na lista à esquerda
3. Marque a checkbox "⚡ Preencher automaticamente ao carregar" no perfil desejado
4. Na próxima vez que acessar o site, o formulário será preenchido automaticamente após 500ms

> **Nota:** Apenas um perfil por site pode ter preenchimento automático ativo.

### 4️⃣ Vinculando Sites

Útil para compartilhar perfis entre ambientes relacionados (ex: `localhost`, `staging`, `production`):

1. Vá em "Configurações"
2. Selecione o site principal
3. Clique em "🔗 Vincular sites"
4. Digite a URL do site relacionado
5. Clique em "Adicionar"

### 5️⃣ Gerenciando Perfis

Na página de configurações você pode:
- **Editar**: Modificar nome e campos de um perfil
- **Renomear**: Alterar apenas o nome do perfil
- **Excluir**: Remover perfis individuais
- **Visualizar**: Ver todos os campos salvos com opção de mostrar/ocultar valores

### 6️⃣ Importar/Exportar Dados

**Exportar:**
1. Vá em "Configurações"
2. Role até "Exportar/Importar dados"
3. Clique em "Exportar dados"
4. Um arquivo JSON será baixado com todas as suas configurações

**Importar:**
1. Clique em "Importar dados"
2. Selecione o arquivo JSON exportado anteriormente
3. Confirme a importação

## 🛠️ Desenvolvimento

### Scripts Disponíveis

```bash
# Compilar TypeScript e CSS
pnpm build

# Compilar apenas CSS
pnpm build:css

# Modo watch (recompila ao detectar mudanças)
pnpm watch

# Executar extensão em modo desenvolvimento
pnpm web:run

# Criar pacote .xpi para distribuição
pnpm web:build

# Verificar código com Biome
pnpm lint

# Corrigir problemas de formatação
pnpm lint:fix

# Formatar código
pnpm format
```

### Estrutura do Projeto

```
smart-autofill/
├── src/                      # Código-fonte TypeScript
│   ├── background.ts         # Script de background (menus, badge)
│   ├── content.ts            # Script de conteúdo (captura/preenchimento)
│   ├── popup.ts              # Popup da extensão
│   ├── options.ts            # Página de configurações
│   ├── services/             # Serviços auxiliares
│   │   └── toast-service.ts  # Sistema de notificações toast
│   ├── utils/                # Utilitários
│   │   ├── key-event-util.ts # Manipulação de eventos de teclado
│   │   ├── strings-util.ts   # Utilitários de string/DOM
│   │   └── svg-util.ts       # Criação de ícones SVG
│   ├── types/                # Definições TypeScript
│   │   ├── global.d.ts       # Tipos globais
│   │   └── index.d.ts        # Tipos da extensão
│   ├── icons/                # Ícones da extensão
│   ├── manifest.json         # Manifesto da extensão
│   ├── popup.html            # HTML do popup
│   ├── options.html          # HTML das configurações
│   ├── styles.scss           # Estilos SCSS
│   └── tailwind.css          # Estilos Tailwind
├── build/                    # Arquivos JavaScript compilados
├── dist/                     # Build final da extensão
├── web-ext-artifacts/        # Pacotes .xpi gerados
├── package.json              # Dependências e scripts
├── tsconfig.json             # Configuração TypeScript
├── biome.json               # Configuração Biome (linter/formatter)
└── build-bundle.js          # Script de build customizado
```

### Tecnologias Utilizadas

- **TypeScript 5.9**: Linguagem principal com tipagem forte
- **Tailwind CSS 4**: Framework CSS utilitário
- **Sass**: Pré-processador CSS
- **Biome**: Linter e formatter ultrarrápido
- **esbuild**: Bundler JavaScript de alta performance
- **web-ext**: Ferramenta oficial para desenvolvimento de extensões Firefox
- **Browser API (WebExtensions)**: APIs do Firefox para extensões

## 🔒 Privacidade e Segurança

- ✅ **Armazenamento Local**: Todos os dados são salvos localmente no navegador usando `browser.storage.local`
- ✅ **Sem Servidor Externo**: Nenhum dado é enviado para servidores externos
- ✅ **Sem Rastreamento**: A extensão não coleta nem transmite informações de uso
- ✅ **Sem Analytics**: Sem ferramentas de análise ou telemetria
- ✅ **Código Aberto**: Todo o código-fonte é público e auditável

### Permissões Necessárias

- `storage`: Para salvar perfis e configurações localmente
- `activeTab`: Para acessar a aba atual e preencher formulários
- `tabs`: Para gerenciar abas e URLs
- `contextMenus`: Para criar menus de contexto personalizados
- `notifications`: Para exibir notificações de feedback
- `<all_urls>`: Para funcionar em qualquer site (apenas quando você usa a extensão)

## 📊 Estrutura de Dados

### AutofillProfile
```typescript
interface AutofillProfile {
  name: string;                    // Nome do perfil
  fields: Record<string, string>;  // Campos capturados (chave: valor)
  timestamp?: number;              // Timestamp de criação
  url?: string;                    // URL original de captura
  createdAt?: string;              // Data de criação formatada
}
```

### AutofillData
```typescript
interface AutofillData {
  [origin: string]: AutofillProfile[];  // Perfis organizados por origem (site)
}
```

### SiteLinks
```typescript
interface SiteLinks {
  [primarySite: string]: string[];  // Sites vinculados a um site principal
}
```

### AutoFillSettings
```typescript
interface AutoFillSettings {
  [key: string]: boolean;  // Formato: "origin_profileIndex": boolean
}
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abrir um Pull Request

### Diretrizes

- Mantenha o código TypeScript totalmente tipado
- Use Biome para formatação (`pnpm format`)
- Teste suas mudanças no Firefox
- Documente novas funcionalidades

## 📝 Changelog

### v0.1.1 (Janeiro 2026)
- 🐛 Corrigir captura de campos ocultos - agora captura apenas campos visíveis
- 📝 Melhorar mensagens de erro quando não há campos preenchidos
- ✨ Aprimoramentos gerais de usabilidade

### v0.1.0 (Janeiro 2026)
- 🎉 Lançamento inicial
- ✨ Captura e preenchimento de formulários
- ⚡ Preenchimento automático ao carregar página
- 🔗 Sistema de vinculação de sites
- 💾 Importação/exportação de dados
- 🎨 Interface moderna com Tailwind CSS
- 📱 Badge com contador de perfis
- 🔔 Sistema de notificações customizáveis

## 🐛 Problemas Conhecidos

- Em alguns sites com frameworks JavaScript reativos (React, Vue, Angular), pode ser necessário clicar em um campo após o preenchimento automático para que o framework detecte a mudança
- Sites com proteção CSRF podem não funcionar corretamente com preenchimento automático

## 📄 Licença

Este projeto está licenciado sob a Licença ISC - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👤 Autor

**@misteregis**

- GitHub: [@misteregis](https://github.com/misteregis)
- Repositório: [smart-autofill](https://github.com/misteregis/smart-autofill)

## 🙏 Agradecimentos

- Comunidade Mozilla Firefox
- Contribuidores de bibliotecas open-source utilizadas
- Todos que testarem e reportarem bugs

## 📞 Suporte

Se encontrar problemas ou tiver sugestões:

1. Verifique a seção [Problemas Conhecidos](#-problemas-conhecidos)
2. Procure em [Issues existentes](https://github.com/misteregis/smart-autofill/issues)
3. Abra uma nova [Issue](https://github.com/misteregis/smart-autofill/issues/new) descrevendo:
   - Versão do Firefox
   - Passos para reproduzir o problema
   - Comportamento esperado vs. atual
   - Screenshots se aplicável

---

**Feito com ❤️ para a comunidade Firefox**
