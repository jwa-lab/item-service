export interface EventBusEvent {
  name: string;
}

export interface EventBus {
  publish<T extends EventBusEvent>(event: T): void;
  subscribe<T extends EventBusEvent>(
    eventName: T["name"],
    callback: (event: T) => void
  ): () => void;
}
