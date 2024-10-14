import { Store } from "../lib/Store";

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

export class DefaultPropertyStore extends Store<DefaultProperties> {
    constructor() {
        super(new DefaultProperties({}));
    }

    set(key: string, value: unknown) {
        this.setState(this.state.set(key, value));
    }
}
