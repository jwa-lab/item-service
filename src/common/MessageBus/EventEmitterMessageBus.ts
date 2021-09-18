import { EventEmitter } from "stream";
import { MessageBus } from "./MessageBus";

export class EventEmitterMessageBus implements MessageBus {
    eventEmitter: EventEmitter;

    constructor() {
        this.eventEmitter = new EventEmitter();
    }

    publish(eventName: string, ...args: any[]): void {
        this.eventEmitter.emit(eventName, ...args);
    }

    subscribe(
        eventName: string,
        callback: (...args: any[]) => void
    ): () => void {
        this.eventEmitter.on(eventName, callback);

        return () => this.eventEmitter.off(eventName, callback);
    }
}
