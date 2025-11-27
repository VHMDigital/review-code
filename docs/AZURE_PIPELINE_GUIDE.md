# Guia de Publicação e Uso no Azure DevOps

## Visão Geral

Este guia explica como publicar o Assistente de Revisão como uma extensão no Azure DevOps Marketplace e usá-lo em pipelines.

## Pré-requisitos

1. **Conta do Visual Studio Marketplace**
   - Acesse [Visual Studio Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
   - Crie um publisher (ou use um existente)

2. **Personal Access Token (PAT)**
   - Acesse Azure DevOps → User Settings → Personal Access Tokens
   - Crie um token com escopo: `Marketplace (Manage)`

3. **Ferramentas Instaladas**
   ```bash
   npm install -g tfx-cli
   ```

## Passo 1: Configurar o Publisher

### 1.1. Atualizar vss-extension.json

Edite o arquivo `vss-extension.json` e atualize:

```json
{
    "id": "assistente-revisao-pr",
    "version": "1.0.0",
    "name": "Assistente de Revisão de Pull Requests",
    "publisher": "SEU-PUBLISHER-ID",
    "description": "Automatize revisões de código em Pull Requests usando IA"
}
```

### 1.2. Atualizar task.json

Edite o arquivo `task.json`:

```json
{
    "id": "NOVO-GUID-UNICO",
    "name": "AssistenteRevisao",
    "friendlyName": "Assistente de Revisão",
    "author": "Seu Nome",
    "version": {
        "Major": 1,
        "Minor": 0,
        "Patch": 0
    }
}
```

**Importante:** Gere um novo GUID único usando:
```bash
# PowerShell
[guid]::NewGuid()

# Node.js
node -e "console.log(require('crypto').randomUUID())"
```

## Passo 2: Compilar e Empacotar

### 2.1. Compilar o Projeto

```bash
npm install
npm run build
npm test
```

### 2.2. Criar o Pacote .vsix

```bash
# Voltar para a raiz do projeto
cd ..

# Criar o pacote
tfx extension create --manifest-globs vss-extension.json
```

Isso gerará um arquivo `.vsix` (ex: `SEU-PUBLISHER.assistente-revisao-pr-1.0.0.vsix`)

## Passo 3: Publicar no Marketplace

### 3.1. Login no tfx-cli

```bash
tfx login
# Service URL: https://marketplace.visualstudio.com
# Personal Access Token: [Cole seu PAT]
```

### 3.2. Publicar a Extensão

```bash
tfx extension publish --manifest-globs vss-extension.json --share-with SEU-ORG-AZURE-DEVOPS
```

Ou publique o arquivo .vsix diretamente:

```bash
tfx extension publish --vsix SEU-ARQUIVO.vsix --share-with SEU-ORG-AZURE-DEVOPS
```

### 3.3. Instalar no Azure DevOps

1. Acesse sua organização Azure DevOps
2. Vá em **Organization Settings** → **Extensions** → **Shared**
3. Encontre sua extensão e clique em **Install**
4. Selecione o projeto onde deseja instalar

## Passo 4: Configurar Variáveis no Azure DevOps

### 4.1. Criar Variable Group

1. Acesse **Pipelines** → **Library** → **+ Variable group**
2. Nome: `OpenAI-Config`
3. Adicione as variáveis:

| Nome | Valor | Tipo |
|------|-------|------|
| `OpenAI_ApiKey` | `sk-...` | Secret |
| `OpenAI_Endpoint` | `https://seu-recurso.openai.azure.com/` | Normal |
| `OpenAI_Version` | `2024-10-21` | Normal |
| `OpenAI_Model` | `gpt-4o` | Normal |

## Passo 5: Criar Pipeline de Revisão

### 5.1. Pipeline Básico (OpenAI)

Crie um arquivo `azure-pipelines-review.yml`:

```yaml
trigger: none

pr:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: OpenAI-Config

jobs:
  - job: CodeReview
    displayName: 'Revisão Automatizada de Código'
    steps:
      - checkout: self
        persistCredentials: true
        
      - task: AssistenteRevisao@1
        displayName: 'Analisar Pull Request'
        inputs:
          api_key: '$(OpenAI_ApiKey)'
          bugs: true
          performance: true
          best_practices: true
          modified_lines_only: true
```

### 5.2. Pipeline Avançado (Azure OpenAI)

```yaml
trigger: none

pr:
  branches:
    include:
      - main
      - develop
      - release/*

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: OpenAI-Config

jobs:
  - job: CodeReview
    displayName: 'Revisão Automatizada de Código'
    steps:
      - checkout: self
        persistCredentials: true
        
      - task: AssistenteRevisao@1
        displayName: 'Analisar Pull Request com Azure OpenAI'
        inputs:
          api_key: '$(OpenAI_ApiKey)'
          api_endpoint: '$(OpenAI_Endpoint)'
          api_version: '$(OpenAI_Version)'
          ai_model: '$(OpenAI_Model)'
          bugs: true
          performance: true
          best_practices: true
          modified_lines_only: true
          file_excludes: '*.json,*.md,*.lock'
          additional_prompts: 'Verificar segurança,Revisar tratamento de erros,Validar testes unitários'
          verbose_logging: false
```

### 5.3. Pipeline com Múltiplos Estágios

```yaml
trigger: none

pr:
  branches:
    include:
      - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: OpenAI-Config

stages:
  - stage: Build
    displayName: 'Build e Testes'
    jobs:
      - job: BuildJob
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '20.x'
          - script: |
              npm install
              npm run build
              npm test
            displayName: 'Build e Executar Testes'

  - stage: CodeReview
    displayName: 'Revisão de Código'
    dependsOn: Build
    condition: succeeded()
    jobs:
      - job: ReviewJob
        steps:
          - checkout: self
            persistCredentials: true
            
          - task: AssistenteRevisao@1
            displayName: 'Análise de Código com IA'
            inputs:
              api_key: '$(OpenAI_ApiKey)'
              api_endpoint: '$(OpenAI_Endpoint)'
              api_version: '$(OpenAI_Version)'
              ai_model: 'gpt-4o'
              bugs: true
              performance: true
              best_practices: true
              confidence_mode: true
              confidence_minimum: '8'
              dedupe_across_files: true
```

## Passo 6: Configurar Branch Policies

### 6.1. Tornar Revisão Obrigatória

1. Acesse **Repos** → **Branches**
2. Clique em `...` na branch main → **Branch policies**
3. Em **Build Validation**, clique em **+**
4. Selecione o pipeline de revisão
5. Configure:
   - **Policy requirement**: Required
   - **Build expiration**: Immediately
   - **Display name**: Revisão Automatizada

## Parâmetros de Configuração Completos

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `api_key` | string | - | **Obrigatório** - Chave de API OpenAI ou Azure OpenAI |
| `api_endpoint` | string | - | URL do endpoint Azure OpenAI |
| `api_version` | string | - | Versão da API Azure OpenAI |
| `ai_model` | picklist | `o4-mini` | Modelo de IA a usar |
| `bugs` | boolean | `false` | Verificar bugs |
| `performance` | boolean | `false` | Verificar performance |
| `best_practices` | boolean | `false` | Verificar boas práticas |
| `modified_lines_only` | boolean | `true` | Analisar apenas linhas modificadas |
| `file_includes` | string | - | Glob de arquivos a incluir (ex: `*.ts,*.js`) |
| `file_excludes` | string | - | Glob de arquivos a excluir (ex: `*.test.ts,*.md`) |
| `additional_prompts` | string | - | Prompts adicionais separados por vírgula |
| `verbose_logging` | boolean | `false` | Habilitar logs detalhados |
| `comment_line_correction` | boolean | `true` | Corrigir números de linha nos comentários |
| `allow_requeue` | boolean | `false` | Permitir revisão em re-execuções |
| `confidence_mode` | boolean | `false` | Modo de confiança (experimental) |
| `confidence_minimum` | string | `9` | Score mínimo de confiança (1-10) |
| `dedupe_across_files` | boolean | `false` | Remover comentários duplicados entre arquivos |
| `dedupe_across_files_threshold` | string | `10` | Limite para deduplicação |

## Solução de Problemas

### Erro: "Task not found"

Verifique se a extensão está instalada:
1. Organization Settings → Extensions → Installed
2. Se não estiver, instale pela aba "Shared"

### Erro: "Invalid API Key"

Verifique:
- Variable Group está vinculado ao pipeline
- Nome da variável está correto (`OpenAI_ApiKey`)
- Tipo da variável está como "Secret"

### Erro: "Permission denied"

Configure permissões:
1. Project Settings → Repositories
2. Selecione o repositório
3. Security → Build Service
4. Adicione permissão "Contribute to pull requests"

### Comentários não aparecem no PR

Verifique:
1. Build Service tem permissão "Contribute to pull requests"
2. `persistCredentials: true` está configurado no checkout
3. Pipeline está rodando no contexto de um Pull Request

## Atualizações da Extensão

### Atualizar Versão

1. Edite `vss-extension.json` e `task.json` incrementando a versão
2. Compile e empacote novamente
3. Publique a atualização:

```bash
tfx extension publish --manifest-globs vss-extension.json
```

### Versão Privada (Teste)

Para testar antes de publicar publicamente:

```bash
tfx extension create --manifest-globs vss-extension.json
tfx extension publish --vsix SEU-ARQUIVO.vsix --share-with SUA-ORG --publisher SEU-PUBLISHER
```

## Recursos Adicionais

- [Azure DevOps Extension Documentation](https://learn.microsoft.com/en-us/azure/devops/extend/)
- [Task Schema Reference](https://learn.microsoft.com/en-us/azure/devops/extend/develop/add-build-task)
- [Extension Manifest Reference](https://learn.microsoft.com/en-us/azure/devops/extend/develop/manifest)
