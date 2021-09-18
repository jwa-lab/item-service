export interface MessageBus {
    publish(eventName: string, ...params: any[]): void;
    subscribe(
        eventName: string,
        callback: (...args: any[]) => void
    ): () => void;
}
