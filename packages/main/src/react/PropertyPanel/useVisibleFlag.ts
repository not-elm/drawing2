import { SelectEntityModeController } from "../../core/SelectEntityModeController";
import { useAtom } from "../hooks/useAtom";
import { useApp } from "../useApp";

export function useVisibleFlag(
    condition: {
        modes?: string[];
        propertyKeys?: string[];
    } = {},
) {
    const { modes = [], propertyKeys = [] } = condition;
    const app = useApp();
    const { mode } = useAtom(app.state);

    const selectedEntities = useAtom(app.canvasStateStore.selectedEntities);

    if (mode !== SelectEntityModeController.MODE_NAME) return false;
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
