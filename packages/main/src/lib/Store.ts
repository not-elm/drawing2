export type StateOf<T> = T extends Store<infer S> ? S : never;

export interface StateProvider<T> {
    getState(): StateOf<T>;
}

export class Store<T> implements StateProvider<Store<T>> {
    private callbacks: Set<(state: T) => void> = new Set();

    constructor(protected state: T) {}

    getState(): T {
        return this.state;
    }

    addListener(callback: (state: T) => void) {
        this.callbacks.add(callback);
    }

    removeListener(callback: (state: T) => void) {
        this.callbacks.delete(callback);
    }

    setState(newState: T) {
        this.state = newState;
        for (const callback of this.callbacks) {
            callback(newState);
        }
    }
}
