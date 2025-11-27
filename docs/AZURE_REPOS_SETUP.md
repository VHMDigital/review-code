# Configuração para Azure Repos Git

Guia completo para usar o Assistente de Revisão com Azure Repos Git.

## Vantagens do Azure Repos Git

✅ **Integração Nativa** - Sem configuração de service connections  
✅ **Permissões Automáticas** - Build Service já tem acesso ao repositório  
✅ **Melhor Performance** - Sem latência de APIs externas  
✅ **Work Items Integration** - Vinculação automática com Work Items  
✅ **Branch Policies** - Controle total de políticas de branch  

## Passo 1: Migrar Repositório do GitHub para Azure Repos

### Opção A: Importar Repositório (Recomendado)

1. No Azure DevOps, vá em **Repos** → **Files**
2. Clique em **Import repository**
3. Preencha:
   - **Clone URL**: `https://github.com/VHMDigital/review-code.git`
   - **Name**: `assistente-revisao`
   - **Requires authentication**: Se o repo é privado, marque e use PAT do GitHub
4. Clique em **Import**

### Opção B: Push Manual

```bash
# Clonar o repositório atual
git clone https://github.com/VHMDigital/review-code.git
cd review-code

# Adicionar remote do Azure Repos
git remote add azure https://dev.azure.com/SUA-ORG/SEU-PROJETO/_git/assistente-revisao

# Push de todas as branches
git push azure --all

# Push de todas as tags
git push azure --tags
```

## Passo 2: Configurar Build Service Permissions

### 2.1. Dar Permissão de Contribuir em PRs

1. Vá em **Project Settings** → **Repositories**
2. Selecione o repositório `assistente-revisao`
3. Clique na aba **Security**
4. Procure por: `[Nome do Projeto] Build Service (SUA-ORG)`
5. Configure as permissões:
   - ✅ **Contribute**: Allow
   - ✅ **Contribute to pull requests**: Allow
   - ✅ **Create tag**: Allow

### 2.2. Permissões em Nível de Projeto (Alternativa)

Se não encontrar acima, configure no nível do projeto:

1. **Project Settings** → **Repositories** → **Security** (tab geral)
2. Procure: `Project Collection Build Service (SUA-ORG)`
3. Configure:
   - ✅ **Contribute to pull requests**: Allow

## Passo 3: Criar Variable Group

1. Vá em **Pipelines** → **Library** → **+ Variable group**
2. Nome: `OpenAI-Config`
3. Adicione as variáveis:

| Nome | Valor | Tipo | Descrição |
|------|-------|------|-----------|
| `OpenAI_ApiKey` | `sk-...` ou chave Azure | Secret | Chave de API |
| `OpenAI_Endpoint` | `https://seu-recurso.openai.azure.com/` | String | Endpoint Azure OpenAI |
| `OpenAI_Version` | `2024-10-21` | String | Versão da API |
| `OpenAI_Model` | `gpt-4o` | String | Modelo a usar |

4. Clique em **Save**

### 3.1. Vincular Variable Group ao Pipeline

1. **Pipelines** → Selecione seu pipeline
2. **Edit** → **Variables** → **Variable groups**
3. Link: `OpenAI-Config`

Ou no YAML (já incluído):
```yaml
variables:
  - group: OpenAI-Config
```

## Passo 4: Publicar Extensão no Azure DevOps

### 4.1. Preparar Arquivos

Atualize `vss-extension.json`:

```json
{
    "id": "assistente-revisao-pr",
    "version": "1.0.0",
    "name": "Assistente de Revisão de Pull Requests",
    "publisher": "SUA-ORGANIZACAO",
    "public": false,
    "description": "Automatize revisões de código usando IA (OpenAI/Azure OpenAI)"
}
```

Atualize `task.json` - gere novo GUID:

```powershell
[guid]::NewGuid()
# Copie o resultado para o campo "id" em task.json
```

### 4.2. Compilar e Empacotar

```bash
# Instalar dependências
npm install

# Compilar TypeScript
npm run build

# Executar testes
npm test

# Voltar à raiz e empacotar
cd ..
tfx extension create --manifest-globs vss-extension.json
```

### 4.3. Publicar na Organização

**Opção 1: Upload Manual (Recomendado para uso privado)**

1. Vá em **Organization Settings** → **Extensions** → **Shared**
2. Clique em **Browse Marketplace**
3. Clique em **Manage Extensions** → **Upload**
4. Selecione o arquivo `.vsix` gerado
5. Clique em **Install** e selecione o projeto

**Opção 2: Via tfx-cli**

```bash
# Compartilhar com sua organização
tfx extension publish --vsix assistente-revisao-pr-1.0.0.vsix \
  --share-with SUA-ORGANIZACAO
```

## Passo 5: Criar Pipeline

### 5.1. Via Interface (Recomendado)

1. Vá em **Pipelines** → **New pipeline**
2. Selecione **Azure Repos Git**
3. Escolha o repositório `assistente-revisao`
4. Selecione **Existing Azure Pipelines YAML file**
5. Escolha `/azure-pipelines.yml`
6. Clique em **Save**

### 5.2. Pipeline YAML Completo

O arquivo `azure-pipelines.yml` na raiz do projeto já está configurado:

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
        inputs:
          api_key: '$(OpenAI_ApiKey)'
          api_endpoint: '$(OpenAI_Endpoint)'
          api_version: '$(OpenAI_Version)'
          ai_model: '$(OpenAI_Model)'
          bugs: true
          performance: true
          best_practices: true
```

## Passo 6: Configurar Branch Policies

### 6.1. Política de Branch Principal

1. Vá em **Repos** → **Branches**
2. Encontre a branch `main`, clique em **...** → **Branch policies**

### 6.2. Configurar Build Validation

Na página de Branch Policies:

1. Em **Build Validation**, clique em **+**
2. Configure:
   - **Build pipeline**: Selecione o pipeline de revisão
   - **Path filter**: Deixe vazio (ou configure filtros específicos)
   - **Trigger**: Automatic
   - **Policy requirement**: Required
   - **Build expiration**: Immediately when main is updated
   - **Display name**: `Revisão Automatizada de Código`
3. Clique em **Save**

### 6.3. Outras Políticas Recomendadas

Configure também:

- ✅ **Require a minimum number of reviewers**: 1 reviewer
- ✅ **Check for linked work items**: Optional
- ✅ **Check for comment resolution**: All active comments must be resolved
- ✅ **Limit merge types**: Squash merge only (recomendado)

## Passo 7: Testar a Configuração

### 7.1. Criar Pull Request de Teste

```bash
# Criar nova branch
git checkout -b test/revisao-automatica

# Fazer uma alteração simples
echo "// Teste de revisão automatica" >> main.ts

# Commit e push
git add main.ts
git commit -m "test: adicionar teste de revisão"
git push origin test/revisao-automatica
```

### 7.2. Criar PR via Azure DevOps

1. Vá em **Repos** → **Pull requests** → **New pull request**
2. Source: `test/revisao-automatica`
3. Target: `main`
4. Clique em **Create**

### 7.3. Verificar Pipeline

1. O pipeline deve iniciar automaticamente
2. Aguarde a conclusão (1-3 minutos)
3. Comentários da IA devem aparecer no PR

## Configurações Avançadas

### Múltiplos Ambientes

```yaml
# azure-pipelines.yml
stages:
  - stage: Dev
    condition: eq(variables['System.PullRequest.TargetBranch'], 'refs/heads/develop')
    jobs:
      - job: ReviewDev
        steps:
          - task: AssistenteRevisao@1
            inputs:
              api_key: '$(OpenAI_ApiKey_Dev)'
              ai_model: 'gpt-3.5-turbo'  # Modelo mais econômico para dev

  - stage: Production
    condition: eq(variables['System.PullRequest.TargetBranch'], 'refs/heads/main')
    jobs:
      - job: ReviewProd
        steps:
          - task: AssistenteRevisao@1
            inputs:
              api_key: '$(OpenAI_ApiKey_Prod)'
              ai_model: 'gpt-4o'  # Modelo premium para produção
```

### Filtros de Arquivo por Linguagem

```yaml
# Apenas TypeScript e JavaScript
- task: AssistenteRevisao@1
  inputs:
    file_includes: '*.ts,*.tsx,*.js,*.jsx'
    file_excludes: '*.test.ts,*.spec.ts,*.d.ts'
```

### Revisão por Tipo de Mudança

```yaml
# Revisão mais rigorosa para arquivos críticos
- task: AssistenteRevisao@1
  condition: contains(variables['System.PullRequest.SourceBranch'], 'hotfix')
  inputs:
    bugs: true
    performance: true
    best_practices: true
    confidence_mode: true
    confidence_minimum: '8'
```

## Solução de Problemas

### Erro: "TF401027: You need the Git 'GenericContribute' permission"

**Solução:**
1. Project Settings → Repositories → Security
2. Encontre `[Projeto] Build Service`
3. Configure `Contribute to pull requests` = Allow

### Pipeline não inicia automaticamente em PRs

**Solução:**
1. Verifique se `trigger: none` está configurado
2. Verifique se o bloco `pr:` está correto
3. Confirme que o pipeline está salvo (não em draft)

### Comentários não aparecem no PR

**Solução:**
1. Verifique `persistCredentials: true` no checkout
2. Confirme permissão "Contribute to pull requests"
3. Verifique logs do pipeline para erros de autenticação

### Erro: "Task 'AssistenteRevisao@1' not found"

**Solução:**
1. Confirme que a extensão está instalada: Organization Settings → Extensions
2. Verifique o nome da task no `task.json` (campo "name")
3. Reinstale a extensão se necessário

## Monitoramento e Métricas

### Visualizar Histórico de Revisões

1. **Pipelines** → Selecione o pipeline
2. **Runs** → Veja todas as execuções
3. Clique em uma execução para ver logs detalhados

### Analytics

1. **Pipelines** → **Analytics**
2. Veja métricas de:
   - Taxa de sucesso
   - Tempo médio de execução
   - Falhas por período

## Próximos Passos

1. ✅ Repositório migrado para Azure Repos
2. ✅ Extensão publicada e instalada
3. ✅ Pipeline configurado
4. ✅ Branch policies ativadas
5. 🎯 Criar PR de teste
6. 🎯 Ajustar configurações conforme necessário
7. 🎯 Treinar equipe sobre o processo

## Recursos Adicionais

- [Azure Repos Git Documentation](https://learn.microsoft.com/en-us/azure/devops/repos/git/)
- [Branch Policies](https://learn.microsoft.com/en-us/azure/devops/repos/git/branch-policies)
- [Azure Pipelines YAML Schema](https://learn.microsoft.com/en-us/azure/devops/pipelines/yaml-schema/)
