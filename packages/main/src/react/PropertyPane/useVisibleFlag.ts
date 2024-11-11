import { SelectEntityModeController } from "../../core/mode/SelectEntityModeController";
import { useApp } from "../hooks/useApp";
import { useCell } from "../hooks/useCell";

export function useVisibleFlag(
    condition: {
        modes?: string[];
        propertyKeys?: string[];
    } = {},
) {
    const { modes = [], propertyKeys = [] } = condition;
    const app = useApp();
    const mode = useCell(app.mode);

    const selectedEntities = useCell(app.canvas.selectedEntities);

    if (mode !== SelectEntityModeController.type) return false;
    if (modes.includes(mode)) return true;

    if (
        selectedEntities.some((entity) =>
            propertyKeys.some((propertyKey) =>
                app.entityHandle.isPropertySupported(entity, propertyKey),
            ),
        )
    ) {
        return true;
    }

    return false;
}
