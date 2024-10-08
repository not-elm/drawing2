import {
    type RefCallback,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

export const ResizeObserverEventEmitter = new (class {
    private observer: ResizeObserver;
    private readonly handlerMap = new WeakMap<
        Element,
        Set<(entry: ResizeObserverEntry) => void>
    >();

    constructor() {
        this.observer = new ResizeObserver(this.handleResize);
    }

    private readonly handleResize = (entries: ResizeObserverEntry[]) => {
        for (const entry of entries) {
            const handlers = this.handlerMap.get(entry.target);
            if (handlers) {
                for (const handler of handlers) {
                    handler(entry);
                }
            }
        }
    };

    addListener(
        target: Element,
        handler: (entry: ResizeObserverEntry) => void,
    ) {
        let handlers = this.handlerMap.get(target);
        if (!handlers) {
            handlers = new Set();
            this.handlerMap.set(target, handlers);
            this.observer.observe(target);
        }
        handlers.add(handler);
    }

    removeListener(
        target: Element,
        handler: (entry: ResizeObserverEntry) => void,
    ) {
        const handlers = this.handlerMap.get(target);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.handlerMap.delete(target);
                this.observer.unobserve(target);
            }
        }
    }
})();

export function useResizeObserver(
    handler: (entry: ResizeObserverEntry) => void,
): RefCallback<Element> {
    const [element, setElement] = useState<Element | null>(null);
    const handlerRef = useRef(handler);
    handlerRef.current = handler;

    const callback = useCallback(
        (entry: ResizeObserverEntry) => handlerRef.current(entry),
        [],
    );

    useEffect(() => {
        if (element === null) return;

        ResizeObserverEventEmitter.addListener(element, callback);

        return () => {
            ResizeObserverEventEmitter.removeListener(element, callback);
        };
    }, [element, callback]);

    return setElement;
}
