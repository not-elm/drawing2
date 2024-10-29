import { atom } from "./atom/Atom";

class DefaultProperties {
    constructor(private properties: Record<string, unknown>) {}

    set(key: string, value: unknown): DefaultProperties {
        return new DefaultProperties({ ...this.properties, [key]: value });
    }

    getOrDefault<T>(key: string, defaultValue: T): T {
        return key in this.properties
            ? (this.properties[key] as T)
            : defaultValue;
    }
}

export class DefaultPropertyStore {
    readonly state = atom(new DefaultProperties({}));

    set(key: string, value: unknown) {
        this.state.set(this.state.get().set(key, value));
    }
}
