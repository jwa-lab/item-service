export interface MessageBus {
  publish(eventName: string, ...params: unknown[]): void;
  subscribe(eventName: string, callback: (...args: unknown[]) => void): () => void;
}
