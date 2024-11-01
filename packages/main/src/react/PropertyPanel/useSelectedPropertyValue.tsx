import { SelectEntityModeController } from "../../core/mode/SelectEntityModeController";
import type { ColorId } from "../../default/property/Colors";
import { isNotNullish } from "../../lib/isNullish";
import { useCell } from "../hooks/useCell";
import { useApp } from "../useApp";

export function useSelectedPropertyValue<T = unknown>(
    propertyKey: string,
): T | null {
    const app = useApp();
    const selectedProperties = useCell(app.selectedProperties);
    const mode = useCell(app.mode);
    const selectedEntities = useCell(app.canvas.selectedEntities);
    if (mode !== SelectEntityModeController.type) return null;

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
        return selectedProperties.getOrDefault(propertyKey, null);
    }

    if (values.size === 1) {
        return (
            (values[Symbol.iterator]().next().value as T | undefined) ?? null
        );
    }

    return null;
}
