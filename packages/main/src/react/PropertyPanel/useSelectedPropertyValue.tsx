import type { ColorId } from "../../core/model/Colors";
import { isNotNullish } from "../../lib/isNullish";
import { useStore } from "../hooks/useStore";
import { useApp } from "../useApp";

export function useSelectedPropertyValue<T = unknown>(
    propertyKey: string,
): T | null {
    const app = useApp();
    const canvasState = useStore(app.canvasStateStore);
    const defaultProperties = useStore(app.defaultPropertyStore);

    const values = new Set(
        canvasState
            .getSelectedEntities()
            .map((entity) => app.handle.getProperty(entity, propertyKey))
            .filter(isNotNullish),
    ) as Set<ColorId>;

    if (values.size === 0) {
        return defaultProperties.getOrDefault(propertyKey, null);
    }

    if (values.size === 1) {
        return (
            (values[Symbol.iterator]().next().value as T | undefined) ?? null
        );
    }

    return null;
}
