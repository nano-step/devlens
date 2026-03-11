export interface AsyncTrackerConfig {
  timeoutMs?: number;
  detectDuplicateRequests?: boolean;
  maxTracked?: number;
}

export type AsyncOperationStatus = 'pending' | 'resolved' | 'rejected' | 'timed-out';

export interface AsyncOperation {
  id: string;
  label: string;
  startTime: number;
  status: AsyncOperationStatus;
  endTime?: number;
  error?: string;
}
