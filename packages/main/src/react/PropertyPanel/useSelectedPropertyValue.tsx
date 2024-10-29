import { SelectEntityModeController } from "../../core/SelectEntityModeController";
import type { ColorId } from "../../default/property/Colors";
import { isNotNullish } from "../../lib/isNullish";
import { useAtom } from "../hooks/useAtom";
import { useApp } from "../useApp";

export function useSelectedPropertyValue<T = unknown>(
    propertyKey: string,
): T | null {
    const app = useApp();
    const defaultProperties = useAtom(app.defaultPropertyStore.state);
    const appState = useAtom(app.state);
    const mode = appState.mode;
    if (mode !== SelectEntityModeController.MODE_NAME) return null;

    const selectedEntities = app.canvasStateStore.selectedEntities.get();

    const values = new Set(
        selectedEntities
            .map((entity) =>
                app.entityHandle.getProperty<T | undefined>(
                    entity,
                    propertyKey,
                    undefined,
                ),
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
