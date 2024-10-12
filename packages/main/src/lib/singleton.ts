export function singleton<T>(factory: () => T): () => T {
    console.count("called:singleton");
    let instance: T | undefined;
    return () => {
        if (instance === undefined) {
            instance = factory();
        }
        return instance;
    };
}
