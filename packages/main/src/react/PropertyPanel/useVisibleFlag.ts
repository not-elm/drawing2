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
    const selectedEntities = app.canvasStateStore
        .getState()
        .getSelectedEntities();

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
