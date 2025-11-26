/**
 * Barrel export para todas as entidades do domínio
 */

// Core entities
export * from './comment';
export * from './thread';
export * from './threadContext';
export * from './threadContextFilePosition';
export * from './review';
export * from './reviewResult';
export * from './iterationRange';
export * from './inputValues';

// Azure DevOps specific entities
export * from './azureDevOps/gitChange';
export * from './azureDevOps/gitChangeItem';
export * from './azureDevOps/gitCommitChanges';
export * from './azureDevOps/gitCommitRef';
export * from './azureDevOps/gitPullRequest';
export * from './azureDevOps/gitPullRequestIterationChange';
export * from './azureDevOps/gitPullRequestIterationChangeItem';
export * from './azureDevOps/gitPullRequestIterationChanges';
export * from './azureDevOps/propertiesCollection';
