import { EventEmitter } from "stream";
import { EventBus, EventBusEvent } from "./EventBus";

export class EventEmitterEventBus implements EventBus {
  eventEmitter: EventEmitter;

  constructor() {
    this.eventEmitter = new EventEmitter();
  }

  publish<T extends EventBusEvent>(event: T): void {
    this.eventEmitter.emit(event.name, event);
  }

  subscribe<T extends EventBusEvent>(
    eventName: T["name"],
    callback: (event: T) => void
  ): () => void {
    this.eventEmitter.on(eventName, callback);

    return () => this.eventEmitter.off(eventName, callback);
  }
}
