# Preenchimento Automático - Smart Autofill

## 📋 Nova Funcionalidade

A extensão Smart Autofill agora suporta **preenchimento automático** de formulários assim que a página carregar!

## ✨ Como Usar

### 1. Configurar Perfil de Preenchimento Automático

1. Clique no ícone da extensão e vá em **"Configurações"** (ou clique com o botão direito no ícone e selecione "Opções")

2. Selecione o site desejado na lista à esquerda

3. Para cada perfil salvo, você verá uma checkbox com a opção:
   ```
   ⚡ Preencher automaticamente ao carregar
   ```

4. Marque a checkbox no perfil que você deseja que seja preenchido automaticamente

> **Nota:** Apenas um perfil por site pode ter o preenchimento automático ativado. Ao ativar um perfil, os outros serão automaticamente desmarcados.

### 2. Funcionamento

- Quando você visitar uma página que tem um perfil com preenchimento automático configurado, os campos serão preenchidos automaticamente após 500ms (meio segundo)
- O delay é intencional para garantir que a página tenha carregado completamente
- Funciona também com sites vinculados

### 3. Exemplo de Uso

**Cenário:** Você acessa frequentemente um site de login

1. Capture os dados do formulário uma vez usando o botão "Capturar Formulário"
2. Salve com um nome descritivo (ex: "Minha Conta")
3. Vá em Configurações → Selecione o site → Marque "Preencher automaticamente ao carregar"
4. Na próxima vez que visitar o site, os campos serão preenchidos automaticamente! 🎉

## 🔒 Segurança

- As configurações são armazenadas localmente no seu navegador
- Apenas sites que você configurou serão preenchidos automaticamente
- Você pode desativar o preenchimento automático a qualquer momento desmarcando a checkbox

## 🛠️ Alterações Técnicas

### Arquivos Modificados:

1. **content.js**
   - Adicionada função IIFE que executa ao carregar a página
   - Verifica se há perfil com auto-fill ativo para o site atual
   - Preenche automaticamente após 500ms

2. **options.js**
   - Nova variável global `autoFillSettings` para armazenar configurações
   - Função `toggleAutoFill()` para gerenciar a ativação/desativação
   - Renderização atualizada para exibir checkbox em cada perfil
   - Garante que apenas um perfil por site tenha auto-fill ativo

3. **options.html**
   - Interface visual permanece a mesma, checkbox é gerado dinamicamente

### Estrutura de Dados:

```javascript
// Novo objeto no storage
autoFillSettings = {
  "https://exemplo.com_0": true,  // site_índiceDoPerfil: boolean
  "https://outro-site.com_1": true
}
```

## 🎯 Dicas

- Use perfis diferentes para diferentes contextos (trabalho, pessoal, testes)
- Vincule sites relacionados para compartilhar o mesmo perfil
- Desative o preenchimento automático se estiver testando formulários manualmente
