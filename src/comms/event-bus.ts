import { EventEmitter } from "events";

/**
 * EventBus is a simple event bus implementation using the EventEmitter from Node.js.
 * It allows you to register callbacks for specific events and emit events with data.
 * In this context, it's used to communicate between agents.
 *
 * @author orbulo
 */
export class EventBus {
  protected eventEmitter: EventEmitter;

  constructor() {
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Register a callback for an event.
   * @param event - The event name.
   * @param callback - The callback function.
   */
  register(event: string, callback: (data: any) => void) {
    if (!this.eventEmitter.eventNames().includes(event)) {
      this.eventEmitter.on(event, callback);
    }
  }

  /**
   * Unregister a callback for an event.
   * @param event - The event name.
   * @param callback - The callback function.
   */
  unregister(event: string, callback: (data: any) => void) {
    if (this.eventEmitter.eventNames().includes(event)) {
      this.eventEmitter.off(event, callback);
    }
  }

  /**
   * Emit an event with data.
   * @param event - The event name.
   * @param data - The data to emit.
   */
  emit(event: string, data: any) {
    this.eventEmitter.emit(event, data);
  }
}
