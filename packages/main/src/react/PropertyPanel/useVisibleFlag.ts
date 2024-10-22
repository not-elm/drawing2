import { SelectEntityModeController } from "../../core/SelectEntityModeController";
import { useStore } from "../hooks/useStore";
import { useApp } from "../useApp";

export function useVisibleFlag(
    condition: {
        modes?: string[];
        propertyKeys?: string[];
    } = {},
) {
    const { modes = [], propertyKeys = [] } = condition;
    const app = useApp();
    const { mode } = useStore(app.appStateStore);
    if (mode !== SelectEntityModeController.MODE_NAME) return false;

    const selectedEntities = app.canvasStateStore
        .getState()
        .getSelectedEntities();

    if (modes.includes(mode)) return true;

    if (
        selectedEntities.some((entity) =>
            propertyKeys.some((propertyKey) =>
                entity.isPropertySupported(propertyKey),
            ),
        )
    ) {
        return true;
    }

    return false;
}
