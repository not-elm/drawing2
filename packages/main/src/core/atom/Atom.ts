import { assert } from "../../lib/assert";

/**
 * Atom is a primitive unit of state.
 */
export interface Atom<T = unknown> {
    get(): T;
    addListener(listener: (value: T) => void): void;
    removeListener(listener: (value: T) => void): void;
}

const AtomDependencyCollector = new (class AtomDependencyCollector {
    private readonly accessedAtoms: Set<Atom>[] = [];

    evaluate<T>(fn: () => T): [T, Set<Atom>] {
        this.accessedAtoms.push(new Set());
        fn();
        const atoms = this.accessedAtoms.pop();
        assert(atoms !== undefined);

        return [fn(), atoms];
    }

    recordAccess(atom: Atom) {
        if (this.accessedAtoms.length === 0) return;

        this.accessedAtoms[this.accessedAtoms.length - 1].add(atom);
    }
})();

export class MutableAtom<T> implements Atom<T> {
    private value: T;
    private readonly listeners: Set<(value: T) => void> = new Set();

    constructor(initialValue: T) {
        this.value = initialValue;
    }

    get() {
        AtomDependencyCollector.recordAccess(this);
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

export class DerivedAtom<T> implements Atom<T> {
    private value: T = null as never;
    private sources = new Set<Atom>();
    private readonly listeners: Set<(value: T) => void> = new Set();

    constructor(private readonly derive: () => T) {
        this.recompute();
    }

    get() {
        AtomDependencyCollector.recordAccess(this);
        return this.value;
    }

    addListener(listener: (value: T) => void) {
        if (this.listeners.size === 0) {
            this.setUpListeners();
        }
        this.listeners.add(listener);
    }

    removeListener(listener: (value: T) => void) {
        this.listeners.delete(listener);
        if (this.listeners.size === 0) {
            this.cleanUpListeners();
        }
    }

    private readonly handleSourceChange = () => {
        this.recompute();
    };

    private recompute() {
        this.cleanUpListeners();
        const [value, sources] = AtomDependencyCollector.evaluate(this.derive);
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

export function atom<T>(initialValue: T): MutableAtom<T> {
    return new MutableAtom(initialValue);
}

export function derived<T>(derive: () => T): DerivedAtom<T> {
    return new DerivedAtom(derive);
}
