export abstract class RunnerPlugin {
  abstract start(): Promise<void>;
  onDestroy?(): Promise<void>;
}
