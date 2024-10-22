import { isSelectEntityMode } from "../../core/SelectEntityModeController";
import { Button } from "../Button";
import { Card } from "../Card";
import { useStore } from "../hooks/useStore";
import { useApp } from "../useApp";

export function OrderSection() {
    const app = useApp();
    const canvasState = useStore(app.canvasStateStore);
    const { mode } = useStore(app.appStateStore);
    if (!isSelectEntityMode(mode) || canvasState.selectedEntityIds.size === 0)
        return null;

    return (
        <Card.Section>
            <Button
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    app.bringToFront();
                }}
            >
                最前面へ
            </Button>
            <Button
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    app.bringForward();
                }}
            >
                ひとつ前へ
            </Button>
            <Button
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    app.sendBackward();
                }}
            >
                ひとつ後ろへ
            </Button>
            <Button
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    app.sendToBack();
                }}
            >
                最背面へ
            </Button>
        </Card.Section>
    );
}
