export interface RunnerPlugin {
  start(): Promise<void>;
  onDestroy?(): Promise<void>;
}
