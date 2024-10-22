import {
    getSelectedEntities,
    isSelectEntityMode,
} from "../../core/SelectEntityModeController";
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
    const canvasState = useStore(app.canvasStateStore);
    const { mode } = useStore(app.appStateStore);
    if (!isSelectEntityMode(mode)) return false;

    const selectedEntities = getSelectedEntities(mode, canvasState.page);

    if (modes.some((m) => mode.type === m)) {
        return true;
    }

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
