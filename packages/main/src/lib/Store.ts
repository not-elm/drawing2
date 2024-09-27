export abstract class Store<T> {
	private callbacks: Set<(state: T) => void> = new Set();

	protected constructor(protected state: T) {}

	getState() {
		return this.state;
	}

	addListener(callback: (state: T) => void) {
		this.callbacks.add(callback);
	}

	removeListener(callback: (state: T) => void) {
		this.callbacks.delete(callback);
	}

	protected setState(newState: T) {
		this.state = newState;
		for (const callback of this.callbacks) {
			callback(newState);
		}
	}
}
