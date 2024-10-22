import {
    getSelectedEntities,
    isSelectEntityMode,
} from "../../core/SelectEntityModeController";
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
    const appState = useStore(app.appStateStore);
    const mode = appState.mode;
    if (!isSelectEntityMode(mode)) return null;

    const selectedEntities = getSelectedEntities(mode, canvasState.page);

    const values = new Set(
        selectedEntities
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
