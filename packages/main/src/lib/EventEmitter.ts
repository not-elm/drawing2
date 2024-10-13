export class EventEmitter<
    T extends { [ev: string]: (...args: never[]) => void },
> {
    private readonly eventHandlers = new Map<keyof T, Set<() => void>>();

    on<K extends keyof T>(ev: K, handler: T[K]): this {
        let handlers = this.eventHandlers.get(ev);
        if (!handlers) {
            handlers = new Set();
            this.eventHandlers.set(ev, handlers);
        }
        handlers.add(handler);
        return this;
    }

    off<K extends keyof T>(ev: K, handler: T[K]) {
        const handlers = this.eventHandlers.get(ev);
        if (!handlers) return;

        handlers.delete(handler);
        return this;
    }

    fire<K extends keyof T>(ev: K, ...args: Parameters<T[K]>) {
        for (const handler of this.eventHandlers.get(ev) ?? []) {
            (handler as T[K]).apply(undefined, args);
        }
    }
}
