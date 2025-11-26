# 🏗️ Arquitetura do Projeto - PR Inspection Assistant

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Camadas da Arquitetura](#camadas-da-arquitetura)
- [Princípios Utilizados](#princípios-utilizados)
- [Fluxo de Execução](#fluxo-de-execução)
- [Como Adicionar Novas Funcionalidades](#como-adicionar-novas-funcionalidades)

## 🎯 Visão Geral

O projeto foi refatorado para seguir os princípios de **Clean Architecture** e **SOLID**, com foco em:

- **Desacoplamento**: Dependências gerenciadas por interfaces
- **Testabilidade**: Fácil criar mocks e testes unitários
- **Manutenibilidade**: Código organizado e responsabilidades bem definidas
- **Extensibilidade**: Fácil adicionar novos recursos sem quebrar o existente

## 📁 Estrutura de Pastas

```
src/
├── config/                     # Configurações e DI Container
│   ├── AppConfig.ts           # Modelo de configuração da aplicação
│   ├── ConfigLoader.ts        # Carrega configs de env vars/task inputs
│   └── ServiceContainer.ts    # Dependency Injection Container
│
├── domain/                     # Camada de Domínio (regras de negócio)
│   ├── entities/              # Entidades do domínio (tipos/DTOs)
│   │   ├── comment.ts
│   │   ├── thread.ts
│   │   ├── review.ts
│   │   ├── azureDevOps/      # Tipos específicos do Azure DevOps
│   │   └── index.ts          # Barrel export
│   │
│   └── interfaces/            # Contratos/Portas (interfaces)
│       ├── IAIClient.ts       # Interface para clientes de IA
│       ├── IRepository.ts     # Interface para repositório Git
│       ├── IPullRequestService.ts  # Interface para Azure DevOps PR
│       ├── IAzureDevOpsClient.ts   # Interface para HTTP client
│       ├── ILogger.ts         # Interface para logging
│       └── index.ts           # Barrel export
│
├── infrastructure/             # Camada de Infraestrutura (implementações externas)
│   ├── adapters/              # Adaptadores para serviços externos
│   │   ├── TaskLogger.ts      # Logger usando Azure DevOps Task Lib
│   │   ├── GitRepository.ts   # Repositório Git usando simple-git
│   │   └── AzureDevOpsHttpClient.ts  # Cliente HTTP para ADO
│   │
│   └── clients/               # Clientes de APIs externas
│       └── OpenAIClient.ts    # Cliente OpenAI/Azure OpenAI
│
├── application/                # Camada de Aplicação (casos de uso)
│   ├── services/              # Serviços de aplicação
│   │   └── PullRequestService.ts  # Orquestração de PRs
│   │
│   └── usecases/              # Casos de uso (orquestração)
│       └── ReviewPullRequestUseCase.ts  # Use case principal
│
├── shared/                     # Código compartilhado
│   ├── utils/                 # Utilitários
│   │   ├── fileUtils.ts       # Filtros de arquivo
│   │   ├── commentUtils.ts    # Manipulação de comentários
│   │   └── index.ts
│   │
│   └── constants/             # Constantes da aplicação
│
├── types.ts                    # Re-exports para compatibilidade
├── main.ts                     # Entry point
└── taskWrapper.ts              # Wrapper para Azure DevOps Task Library
```

## 🏛️ Camadas da Arquitetura

### 1. **Domain** (Domínio - Núcleo)
- **Responsabilidade**: Regras de negócio e modelos
- **Não depende de nada**: Camada mais interna
- **Contém**:
  - **Entities**: Modelos de dados (DTOs)
  - **Interfaces**: Contratos que outras camadas devem implementar

### 2. **Application** (Aplicação - Casos de Uso)
- **Responsabilidade**: Orquestração da lógica de negócio
- **Depende de**: Domain
- **Contém**:
  - **UseCases**: Fluxos de execução específicos
  - **Services**: Lógica de negócio mais complexa

### 3. **Infrastructure** (Infraestrutura - Implementações)
- **Responsabilidade**: Implementações concretas de interfaces
- **Depende de**: Domain, Application
- **Contém**:
  - **Adapters**: Implementações de interfaces do domínio
  - **Clients**: Clientes para APIs externas

### 4. **Config** (Configuração)
- **Responsabilidade**: Configuração e inicialização
- **Contém**:
  - **ConfigLoader**: Carrega configurações de env vars
  - **ServiceContainer**: Dependency Injection Container

### 5. **Shared** (Compartilhado)
- **Responsabilidade**: Código utilitário reutilizável
- **Contém**:
  - **Utils**: Funções auxiliares
  - **Constants**: Constantes globais

## 🎯 Princípios Utilizados

### SOLID

1. **S**ingle Responsibility Principle
   - Cada classe tem uma única responsabilidade
   - Ex: `OpenAIClient` só lida com comunicação com OpenAI

2. **O**pen/Closed Principle
   - Aberto para extensão, fechado para modificação
   - Ex: Adicionar novo logger sem alterar código existente

3. **L**iskov Substitution Principle
   - Interfaces podem ser substituídas por implementações
   - Ex: `ILogger` pode ser `TaskLogger` ou `ConsoleLogger`

4. **I**nterface Segregation Principle
   - Interfaces pequenas e específicas
   - Ex: `IAIClient`, `IRepository` separados

5. **D**ependency Inversion Principle
   - Dependa de abstrações, não de implementações
   - Ex: UseCases dependem de `IRepository`, não de `GitRepository`

### Dependency Injection

- Todas as dependências são injetadas via construtor
- `ServiceContainer` gerencia criação e lifecycle
- Fácil substituir implementações para testes

### Clean Architecture

- Fluxo de dependências: **externa → interna**
- Domain não conhece Infrastructure
- Infrastructure conhece Domain (implementa interfaces)

## 🔄 Fluxo de Execução

```
1. main.ts
   ↓
2. ConfigLoader.load()
   ↓ (carrega configurações)
3. ServiceContainer.create(config)
   ↓ (cria todas as dependências)
4. ReviewPullRequestUseCase.execute()
   ↓
5. Use Case orquestra serviços:
   - Repository (getDiff)
   - PullRequestService (getFiles, addThreads)
   - AIClient (performCodeReview)
   - Logger (info, setProgress)
   ↓
6. Resultado: PR revisado com comentários
```

### Diagrama Simplificado

```
┌─────────────────────────────────────────────────────┐
│                     main.ts                         │
└──────────────────────┬──────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────┐
│              ConfigLoader + ServiceContainer        │
│  (Cria e injeta todas as dependências)              │
└──────────────────────┬──────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────┐
│          ReviewPullRequestUseCase                   │
│  (Orquestra o fluxo completo de revisão)            │
└──┬──────────┬──────────────┬──────────────┬─────────┘
   │          │              │              │
   ↓          ↓              ↓              ↓
┌────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│AIClient│ │Repository│ │PR Service│ │  Logger  │
└────────┘ └──────────┘ └──────────┘ └──────────┘
   │            │            │            │
   ↓            ↓            ↓            ↓
OpenAI    simple-git    Azure ADO   Task Logger
```

## 🚀 Como Adicionar Novas Funcionalidades

### Adicionar um Novo Cliente de IA (ex: Anthropic Claude)

1. **Criar interface** (se necessário) em `domain/interfaces/`
2. **Criar implementação** em `infrastructure/clients/`
   ```typescript
   export class ClaudeClient implements IAIClient {
       // implementação
   }
   ```
3. **Registrar no ServiceContainer**
   ```typescript
   const aiClient = config.aiProvider === 'claude'
       ? new ClaudeClient(config, logger)
       : new OpenAIClient(config, logger);
   ```

### Adicionar um Novo Use Case

1. **Criar arquivo** em `application/usecases/`
   ```typescript
   export class GenerateReportUseCase {
       constructor(private container: IServiceContainer) {}
       
       async execute(): Promise<void> {
           // lógica do use case
       }
   }
   ```
2. **Usar no main.ts** ou chamá-lo de outro use case

### Adicionar Nova Configuração

1. **Atualizar interface** em `config/AppConfig.ts`
   ```typescript
   export interface IAppConfig {
       // ... existing
       newFeature: {
           enabled: boolean;
           option: string;
       };
   }
   ```
2. **Carregar valor** em `ConfigLoader.ts`
   ```typescript
   newFeature: {
       enabled: tl.getBoolInput('new_feature_enabled', false),
       option: tl.getInput('new_feature_option', false) || 'default',
   }
   ```

### Adicionar Testes

Graças ao desacoplamento, é fácil criar mocks:

```typescript
// Mock do logger
const mockLogger: ILogger = {
    info: jest.fn(),
    debug: jest.fn(),
    // ...
};

// Mock do AI Client
const mockAIClient: IAIClient = {
    performCodeReview: jest.fn().mockResolvedValue({ threads: [] }),
    exceedsTokenLimit: jest.fn().mockReturnValue(false),
};

// Criar container de teste
const testContainer: IServiceContainer = {
    logger: mockLogger,
    aiClient: mockAIClient,
    // ...
};

// Testar use case
const useCase = new ReviewPullRequestUseCase(testContainer);
await useCase.execute();
```

## 📝 Boas Práticas

### ✅ DO (Faça)

- Use interfaces para definir contratos
- Injete dependências via construtor
- Mantenha classes pequenas e focadas
- Use barrel exports (`index.ts`) para organizar imports
- Documente interfaces e métodos públicos
- Valide configurações na inicialização

### ❌ DON'T (Não Faça)

- Não crie instâncias diretamente com `new` (use DI)
- Não acesse variáveis de ambiente diretamente (use AppConfig)
- Não misture lógicas de negócio com infraestrutura
- Não faça Domain depender de Infrastructure
- Não use `any` - prefira types específicos

## 🧪 Testabilidade

A nova arquitetura permite:

- **Testes unitários**: Mock de cada dependência individualmente
- **Testes de integração**: Substituir apenas infraestrutura
- **Testes E2E**: Usar implementações reais

Exemplo de teste:

```typescript
describe('ReviewPullRequestUseCase', () => {
    it('should review all files', async () => {
        // Arrange
        const mockContainer = createMockContainer();
        const useCase = new ReviewPullRequestUseCase(mockContainer);
        
        // Act
        await useCase.execute();
        
        // Assert
        expect(mockContainer.aiClient.performCodeReview).toHaveBeenCalledTimes(3);
    });
});
```

## 🔧 Manutenção

### Atualizar Dependência Externa

1. **Atualizar adapter** em `infrastructure/adapters/`
2. **Interface permanece igual** - código cliente não precisa mudar
3. Exemplo: Migrar de `simple-git` para outra lib:
   ```typescript
   // Apenas GitRepository.ts muda
   // Ninguém mais precisa saber
   ```

### Trocar Implementação

Graças ao DI, é só alterar o `ServiceContainer`:

```typescript
// Antes
const logger = new TaskLogger();

// Depois
const logger = config.development.isDev 
    ? new ConsoleLogger() 
    : new TaskLogger();
```

## 📚 Referências

- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)

---

**Desenvolvido com ❤️ para manutenibilidade e escalabilidade**
