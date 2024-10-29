import { assert } from "../../lib/assert";

/**
 * An unit of value.
 */
export interface ICell<T = unknown> {
    /**
     * Get the current value of the cell. Cell must call
     * {@link DependencyCollector.recordAccess()} everytime
     * when it is accessed.
     */
    get(): T;

    /**
     * Add a listener that will be called whenever the value of the cell changes.
     * @param listener
     */
    addListener(listener: (value: T) => void): void;

    /**
     * Remove a listener.
     * @param listener
     */
    removeListener(listener: (value: T) => void): void;
}

const DependencyCollector = new (class DependencyCollector {
    private readonly sourceCellSets: Set<ICell>[] = [];

    /**
     * Evaluate a function and collect all cells accessed during the evaluation.
     * @param fn Function to evaluate
     * @returns A tuple of the return value and the set of cells accessed during the evaluation
     */
    evaluate<T>(fn: () => T): [value: T, cells: Set<ICell>] {
        this.sourceCellSets.push(new Set());
        const value = fn();
        const cells = this.sourceCellSets.pop();
        assert(cells !== undefined);

        return [value, cells];
    }

    /**
     * Record an access to an cell. Cells must call this method everytime
     * when it is accessed.
     * @param cell Cell that is accessed
     */
    recordAccess(cell: ICell) {
        if (this.sourceCellSets.length === 0) return;

        this.sourceCellSets[this.sourceCellSets.length - 1].add(cell);
    }
})();

export class Cell<T> implements ICell<T> {
    private value: T;
    private readonly listeners: Set<(value: T) => void> = new Set();

    constructor(
        initialValue: T,
        public readonly label: string,
    ) {
        this.value = initialValue;
    }

    get() {
        DependencyCollector.recordAccess(this);
        return this.value;
    }

    set(value: T) {
        this.value = value;

        // Clone the listeners to avoid mutation during iteration
        const listeners = [...this.listeners];
        for (const listener of listeners) {
            listener(value);
        }
    }

    addListener(listener: (value: T) => void) {
        this.listeners.add(listener);
    }

    removeListener(listener: (value: T) => void) {
        this.listeners.delete(listener);
    }
}

export class DerivedCell<T> implements ICell<T> {
    private value: T = null as never;
    private sources = new Set<ICell>();
    private readonly listeners: Set<(value: T) => void> = new Set();

    constructor(
        private readonly derive: () => T,
        public readonly label: string,
    ) {
        this.recompute();
    }

    get() {
        DependencyCollector.recordAccess(this);
        return this.value;
    }

    addListener(listener: (value: T) => void) {
        this.listeners.add(listener);
    }

    removeListener(listener: (value: T) => void) {
        this.listeners.delete(listener);
    }

    private readonly handleSourceChange = () => {
        this.recompute();
    };

    private recompute() {
        this.cleanUpListeners();
        const [value, sources] = DependencyCollector.evaluate(this.derive);
        this.value = value;
        this.sources = sources;
        this.setUpListeners();

        // Clone the listeners to avoid mutation during iteration
        const listeners = [...this.listeners];
        for (const listener of listeners) {
            listener(this.value);
        }
    }

    private setUpListeners() {
        for (const source of this.sources) {
            source.addListener(this.handleSourceChange);
        }
    }

    private cleanUpListeners() {
        for (const source of this.sources) {
            source.removeListener(this.handleSourceChange);
        }
    }
}

export function cell<T>(initialValue: T, label = ""): Cell<T> {
    return new Cell(initialValue, label);
}

export function derived<T>(derive: () => T, label = ""): DerivedCell<T> {
    return new DerivedCell(derive, label);
}
