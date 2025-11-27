# 🚀 Guia Rápido de Desenvolvimento - PRIA

Este guia fornece instruções rápidas para começar a desenvolver no projeto PR Inspection Assistant.

---

## 📋 Pré-requisitos

- Node.js 20.x ou superior
- npm 10.x ou superior
- Git
- Visual Studio Code (recomendado)
- Conta OpenAI ou Azure OpenAI
- Conta Azure DevOps

---

## ⚡ Setup Rápido

### 1. Clone e Instale

```powershell
# Clone o repositório
git clone https://github.com/ewellnitz/pr-inspection-assistant.git
cd pr-inspection-assistant

# Instale dependências
npm install
```

### 2. Configure Ambiente Local

```powershell
# Copie o arquivo de exemplo
Copy-Item .env.example .env.local

# Edite .env.local com suas credenciais
code .env.local
```

**Variáveis mínimas necessárias para teste local**:

```env
# Azure DevOps
System_AccessToken=seu_pat_token_aqui
System_CollectionUri=https://dev.azure.com/sua-org/
System_TeamProject=SeuProjeto
System_PullRequest_PullRequestId=123
System_DefaultWorkingDirectory=C:/caminho/para/seu/repo/local

# OpenAI
api_key=sk-proj-xxxxx

# Opções de Review
modified_lines_only=true
comment_line_correction=true
```

### 3. Compile e Execute

```powershell
# Compilar TypeScript
npm run build

# Rodar testes
npm test

# Executar localmente (precisa de .env.local configurado)
npm run dev

# Modo watch (recompila automaticamente)
npm run build:watch
```

---

## 🏗️ Estrutura do Código

### Camadas Principais

```
src/
├── config/           → Configuração e DI
├── domain/           → Regras de negócio
├── infrastructure/   → Implementações externas
├── application/      → Casos de uso
├── shared/          → Utilitários
└── main.ts          → Entry point
```

### Fluxo de Execução

```
main.ts 
  → ConfigLoader.load()
  → ServiceContainer.create()
  → ReviewPullRequestUseCase.execute()
     → Repository.getDiff()
     → AIClient.performCodeReview()
     → PullRequestService.addThreads()
```

---

## 🧪 Testes

### Executar Testes

```powershell
# Todos os testes
npm test

# Modo watch
npm run test:watch

# Com cobertura
npm run test:coverage
```

### Criar Novo Teste

```typescript
// tests/unit/MeuComponente.test.ts
import { MeuComponente } from '../../caminho/MeuComponente';

describe('MeuComponente', () => {
    it('should do something', () => {
        // Arrange
        const component = new MeuComponente();
        
        // Act
        const result = component.doSomething();
        
        // Assert
        expect(result).toBe(expected);
    });
});
```

---

## 🔨 Desenvolvimento

### Adicionar Nova Funcionalidade

1. **Defina a interface** em `domain/interfaces/`
2. **Crie a implementação** em `infrastructure/` ou `application/`
3. **Registre no ServiceContainer** em `config/ServiceContainer.ts`
4. **Adicione testes** em `tests/unit/`
5. **Documente** no README ou docs relevantes

### Exemplo: Adicionar Novo Cliente de IA

```typescript
// 1. Interface (domain/interfaces/IAIClient.ts)
export interface IAIClient {
    performCodeReview(diff: string, fileName: string): Promise<Review>;
}

// 2. Implementação (infrastructure/clients/ClaudeClient.ts)
export class ClaudeClient implements IAIClient {
    async performCodeReview(diff: string, fileName: string): Promise<Review> {
        // Implementação
    }
}

// 3. ServiceContainer (config/ServiceContainer.ts)
const aiClient = config.openai.provider === 'claude'
    ? new ClaudeClient(config, logger)
    : new OpenAIClient(config, logger);

// 4. Testes (tests/unit/ClaudeClient.test.ts)
describe('ClaudeClient', () => {
    it('should review code', async () => {
        // Testes aqui
    });
});
```

---

## 🐛 Debug

### VS Code Launch Configuration

Crie `.vscode/launch.json`:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Debug PRIA",
            "skipFiles": ["<node_internals>/**"],
            "program": "${workspaceFolder}/main.ts",
            "preLaunchTask": "npm: build",
            "outFiles": ["${workspaceFolder}/**/*.js"],
            "envFile": "${workspaceFolder}/.env.local"
        }
    ]
}
```

### Logs de Debug

```typescript
// Use o logger injetado
this.logger.debug('Mensagem de debug');
this.logger.info('Informação');
this.logger.warning('Aviso');
this.logger.error('Erro');
```

---

## 📦 Build e Deploy

### Build para Produção

```powershell
# Build completo (TypeScript + testes + package)
npm run package
```

Este comando:
1. Compila TypeScript
2. Executa todos os testes
3. Cria arquivo `.vsix` para publicação no marketplace

### Publicar no Marketplace

```powershell
# Usando TFX CLI
tfx extension publish --manifest-globs vss-extension.json --token seu_pat_token
```

---

## 🔍 Dicas e Truques

### 1. TypeScript Strict Mode

O projeto usa TypeScript strict mode. Sempre:
- ✅ Defina tipos explícitos
- ✅ Evite `any`
- ✅ Trate `null` e `undefined`
- ✅ Use interfaces para contratos

### 2. Injeção de Dependências

Sempre injete dependências via construtor:

```typescript
// ✅ Correto
export class MeuServico {
    constructor(
        private readonly logger: ILogger,
        private readonly config: IAppConfig
    ) {}
}

// ❌ Errado
export class MeuServico {
    private logger = new Logger(); // Evite criar instâncias diretamente
}
```

### 3. Testes com Mocks

Use mocks para isolar componentes:

```typescript
const mockLogger: ILogger = {
    info: jest.fn(),
    debug: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
};

const service = new MeuServico(mockLogger);
```

### 4. Async/Await

Sempre use async/await em vez de Promises:

```typescript
// ✅ Correto
async function fetchData() {
    const data = await client.get();
    return data;
}

// ❌ Evite
function fetchData() {
    return client.get().then(data => data);
}
```

---

## 🚨 Problemas Comuns

### Erro: "Cannot find module"

```powershell
# Limpe e reinstale
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json
npm install
```

### Erro: "TypeScript compilation failed"

```powershell
# Verifique erros
npm run build

# Limpe arquivos compilados
Remove-Item *.js, *.js.map -Recurse
npm run build
```

### Erro: "Tests timeout"

Aumente o timeout no jest.config.ts:

```typescript
export default {
    testTimeout: 10000, // 10 segundos
}
```

---

## 📚 Recursos Úteis

### Documentação

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura completa
- [REFACTORING_STATUS.md](./REFACTORING_STATUS.md) - Status da refatoração
- [SETUP_PT-BR.md](./SETUP_PT-BR.md) - Setup detalhado

### Links Externos

- [Azure DevOps Task SDK](https://github.com/microsoft/azure-pipelines-task-lib)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

### Comunidade

- [GitHub Issues](https://github.com/ewellnitz/pr-inspection-assistant/issues)
- [Marketplace](https://marketplace.visualstudio.com/items?itemName=EricWellnitz.pria)

---

## 🎯 Checklist de PR

Antes de criar um Pull Request, verifique:

- [ ] Código compila sem erros (`npm run build`)
- [ ] Todos os testes passam (`npm test`)
- [ ] Adicionou testes para novas funcionalidades
- [ ] Documentação atualizada
- [ ] Commits seguem convenção (feat:, fix:, docs:, etc.)
- [ ] Sem console.log esquecidos
- [ ] Sem TODOs não resolvidos
- [ ] Code review interno realizado

---

## 💻 Comandos Úteis

```powershell
# Desenvolvimento
npm run build              # Compila TypeScript
npm run build:watch        # Compila em modo watch
npm test                   # Executa testes
npm run dev                # Executa localmente

# Package
npm run package            # Build completo + package

# Linting (se configurado)
npm run lint               # Verifica código
npm run lint:fix           # Corrige automaticamente

# Outros
npm run clean              # Limpa arquivos compilados
npm run typecheck          # Verifica tipos sem compilar
```

---

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/minha-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

---

## 📞 Suporte

Se precisar de ajuda:

1. Verifique a documentação em `docs/`
2. Procure por issues similares no GitHub
3. Abra uma nova issue se necessário

---

**Happy Coding! 🎉**

*Última atualização: 26 de Novembro de 2025*
