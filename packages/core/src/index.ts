export { createNetworkInterceptor } from './network/interceptor';
export { createDataGuardian } from './guardian/data-guardian';
export { createGlobalCatcher } from './catcher/global-catcher';
export { createDetectionEngine } from './engine/detection-engine';
export { createConsoleReporter } from './reporter/console-reporter';
export { createApiContractPlugin } from './contract/api-contract';
export { createAsyncTrackerPlugin } from './async/async-tracker';

export type {
  Severity,
  IssueCategory,
  DetectedIssue,
  DevLensConfig,
  NetworkInterceptorConfig,
  DataGuardianConfig,
  GlobalCatcherConfig,
  IgnorePatterns,
  NetworkResponse,
  Reporter,
  DevLensPlugin,
  DevLensEngine,
} from './types';

export type {
  ContractConfig,
  APIShape,
  ContractViolation,
} from './contract/types';

export type {
  AsyncTrackerConfig,
  AsyncOperation,
} from './async/types';
