# Code Review

Automatize revisões de código em Pull Requests do Azure DevOps usando IA (OpenAI ou Azure OpenAI). O assistente analisa alterações de código, sugere melhorias, detecta bugs e garante boas práticas de desenvolvimento.

## Recursos

- **Revisões Automatizadas**: Análise inteligente de código usando modelos OpenAI
- **Azure OpenAI**: Suporte completo para modelos privados no Azure AI Foundry
- **Feedback Natural**: Comentários em linguagem clara e acionável
- **Altamente Configurável**: Personalize critérios de revisão conforme suas necessidades

## Pré-requisitos

- Chave de API da [OpenAI](https://platform.openai.com/docs/overview) ou Azure OpenAI
- Permissão "Contribute to pull requests" para Build Administrators no Azure DevOps

### Para Azure OpenAI

- Chave de API do serviço Azure OpenAI
- URL do endpoint (ex: `https://seu-recurso.openai.azure.com/`)
- Modelo implantado (o4-mini, o3-mini, o1-mini, gpt-4o, gpt-4, gpt-3.5-turbo)
- Versão da API (padrão: `2024-10-21`)

## Configuração Rápida

### 1. Pipeline YAML Básico

**OpenAI API:**
```yaml
trigger: none

jobs:
  - job: CodeReview
    pool:
      vmImage: 'ubuntu-latest'
    steps:
      - checkout: self
        persistCredentials: true
      - task: PRIA@2
        inputs:
          api_key: '$(OpenAI_ApiKey)'
```

**Azure OpenAI:**
```yaml
trigger: none

jobs:
  - job: CodeReview
    pool:
      vmImage: 'ubuntu-latest'
    steps:
      - checkout: self
        persistCredentials: true
      - task: PRIA@2
        inputs:
          api_key: '$(OpenAI_ApiKey)'
          api_version: '2024-10-21'
          api_endpoint: 'https://seu-projeto.openai.azure.com/'
          ai_model: 'gpt-4o'
```

### 2. Opções Disponíveis

| Parâmetro             | Tipo    | Padrão  | Descrição                                           |
| --------------------- | ------- | ------- | --------------------------------------------------- |
| `bugs`                | Boolean | `false` | Habilita verificação de bugs                        |
| `performance`         | Boolean | `false` | Inclui análise de performance                       |
| `best_practices`      | Boolean | `false` | Verifica boas práticas não aplicadas                |
| `modified_lines_only` | Boolean | `true`  | Analisa apenas linhas modificadas                   |
| `file_extensions`     | String  | `null`  | Extensões de arquivos para revisar (separadas por vírgula) |
| `file_excludes`       | String  | `null`  | Arquivos a excluir da revisão (separados por vírgula) |
| `additional_prompts`  | String  | `null`  | Prompts adicionais personalizados (separados por vírgula) |

### 3. Configurar Branch Policy

Configure a [política de branch](https://learn.microsoft.com/pt-br/azure/devops/repos/git/branch-policies) no Azure DevOps para usar o pipeline de revisão como validação de build.

## Desenvolvimento

### Compilar e Publicar

```bash
npm install
npm run build
npm test
npm run package
```

### Teste Local

1. Copie `.env.example` para `.env` e preencha as variáveis
2. Execute `npm run dev`

## Documentação

- [Configuração Azure Repos Git](docs/AZURE_REPOS_SETUP.md) ⭐ **Recomendado**
- [Guia Completo Azure Pipelines](docs/AZURE_PIPELINE_GUIDE.md)
- [Arquitetura](docs/ARCHITECTURE.md)
- [Guia Rápido](docs/QUICK_START.md)
- [Status da Refatoração](docs/REFACTORING_STATUS.md)
