import type { ColorId } from "../../default/property/Colors";
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
            .map((entity) =>
                entity.getProperty<T | undefined>(propertyKey, undefined),
            )
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
