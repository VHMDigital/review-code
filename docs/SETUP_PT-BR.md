# 🚀 Guia de Instalação e Configuração - PR Inspection Assistant

## 📝 Sobre o Projeto

O **PR Inspection Assistant (PRIA)** é uma extensão para Azure DevOps que utiliza OpenAI ou Azure OpenAI para realizar revisões automáticas de código em Pull Requests. A ferramenta analisa mudanças no código, oferece sugestões, detecta bugs potenciais e garante a aderência a padrões de codificação.

## ✅ Pré-requisitos

Antes de começar, certifique-se de ter:

- **Node.js** (versão 16 ou superior)
- **npm** (geralmente instalado junto com Node.js)
- **Git** instalado e configurado
- **Chave da API OpenAI** ou **Azure OpenAI**
  - OpenAI: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
  - Azure OpenAI: Configure um serviço no Azure AI Foundry
- **Acesso ao Azure DevOps** com permissões apropriadas
- **Token de Acesso Pessoal (PAT)** do Azure DevOps

## 📦 Instalação

### 1. Clone o Repositório

```powershell
git clone https://github.com/ewellnitz/pr-inspection-assistant.git
cd pr-inspection-assistant
```

### 2. Instale as Dependências

```powershell
cd pr-inspection-assistant\src
npm install
```

### 3. Compile o Código TypeScript

```powershell
npm run build
```

## ⚙️ Configuração Local (Desenvolvimento)

### 1. Configure o Arquivo .env.local

Já foi criado um arquivo `.env.local` no diretório `src/`. Edite-o e configure as seguintes variáveis:

```dotenv
# Chave da API do OpenAI
Api_Key=sk-proj-SUA_CHAVE_AQUI

# Modelo OpenAI (opções: gpt-4o, gpt-4, gpt-3.5-turbo, etc.)
Ai_Model=gpt-4o

# Token de Acesso do Azure DevOps
System_AccessToken=SEU_TOKEN_PAT_AQUI

# Caminho do repositório local
System_DefaultWorkingDirectory=C:\Projetos\assistente-analitico

# Branch de origem
System_PullRequest_SourceBranch=feature/sua-branch

# Branch de destino (normalmente main ou master)
System_PullRequest_TargetBranchName=main

# URL do Azure DevOps
System_TeamFoundationCollectionUri=https://dev.azure.com/sua-organizacao/

# ID do Team Project
System_TeamProjectId=seu-project-id

# Nome do repositório
Build_Repository_Name=assistente-analitico

# ID do Pull Request
System_PullRequest_PullRequestId=1
```

### 2. Configuração para Azure OpenAI (Opcional)

Se você estiver usando Azure OpenAI em vez da API OpenAI padrão, adicione também:

```dotenv
# Adicione estas variáveis para Azure OpenAI
Api_Version=2024-10-21
Api_Endpoint=https://seu-recurso.openai.azure.com/
```

## 🏃 Como Executar Localmente

### Teste em Modo de Desenvolvimento

```powershell
cd pr-inspection-assistant\src
npm run dev
```

### Preparar para Executar em um PR Específico

1. No seu repositório local, configure o branch do PR:

```powershell
# Navegar para o repositório que será revisado
cd C:\Projetos\seu-repositorio

# Buscar o refspec dos pull requests
git fetch --force --tags --prune --prune-tags --progress --no-recurse-submodules origin +refs/heads/*:refs/remotes/origin/* +refs/pull/123/merge:refs/remotes/pull/123/merge

# Fazer checkout do branch do PR (substitua 123 pelo ID do seu PR)
git checkout pull/123/merge

# Verificar as diferenças
git diff --name-only origin/main
```

2. Execute o assistente:

```powershell
cd C:\Projetos\assistente-analitico\pr-inspection-assistant\src
npm run dev
```

## 📦 Build para Produção

Para criar o pacote `.vsix` da extensão:

```powershell
cd pr-inspection-assistant\src
npm run package
```

Isso irá:
1. Compilar o TypeScript
2. Executar os testes
3. Criar o arquivo `.vsix` no diretório raiz

## 🔧 Opções de Configuração

### Opções de Revisão

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `Bugs` | Boolean | `true` | Verificar bugs no código |
| `Performance` | Boolean | `true` | Verificar problemas de performance |
| `Best_Practices` | Boolean | `true` | Verificar boas práticas |
| `Modified_Lines_Only` | Boolean | `true` | Revisar apenas linhas modificadas |
| `Verbose_Logging` | Boolean | `false` | Habilitar logging detalhado |

### Filtros de Arquivo

Você pode configurar quais arquivos serão revisados:

```dotenv
# Incluir apenas arquivos específicos (glob pattern)
File_Includes=*.ts,*.js,*.py

# Excluir arquivos específicos (glob pattern)
File_Excludes=*.json,*.md,*.lock,node_modules/**
```

### Prompts Adicionais

Adicione instruções personalizadas para a revisão:

```dotenv
Additional_Prompts=Check for security vulnerabilities,Ensure proper error handling,Verify input validation
```

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de autenticação no Azure DevOps**
   - Verifique se o Token PAT está correto
   - Certifique-se de que o token tem as permissões necessárias

2. **Erro com a API OpenAI**
   - Verifique se a chave da API está correta
   - Confirme se há créditos/quota disponível na conta OpenAI

3. **Erro ao compilar TypeScript**
   - Execute `npm install` novamente
   - Verifique a versão do Node.js (deve ser 16+)

4. **Vulnerabilidades no npm audit**
   - Execute `npm audit fix` para corrigir problemas que não quebram a compatibilidade
   - Para forçar correções: `npm audit fix --force` (cuidado, pode causar breaking changes)

## 📚 Recursos Adicionais

- [Documentação Oficial](https://github.com/ewellnitz/pr-inspection-assistant)
- [Azure DevOps Marketplace](https://marketplace.visualstudio.com/items?itemName=EricWellnitz.pria)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Azure OpenAI Documentation](https://learn.microsoft.com/en-us/azure/ai-studio/azure-openai-in-ai-studio)

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## 📄 Licença

Consulte o arquivo LICENSE para mais detalhes.

---

**Desenvolvido com ❤️ para melhorar a qualidade do código através de IA**
