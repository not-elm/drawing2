import { Button } from "../Button";
import { Card } from "../Card";
import { useStore } from "../hooks/useStore";
import { useApp } from "../useApp";

export function OrderSection() {
    const app = useApp();
    const { mode } = useStore(app.appStateStore);
    const { selectedEntityIds } = useStore(app.canvasStateStore);

    const visible = mode.type === "select" && selectedEntityIds.length > 0;

    if (!visible) return null;

    return (
        <Card.Section>
            <Button
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    app.canvasStateStore.bringToFront();
                }}
            >
                最前面へ
            </Button>
            <Button
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    app.canvasStateStore.bringForward();
                }}
            >
                ひとつ前へ
            </Button>
            <Button
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    app.canvasStateStore.sendBackward();
                }}
            >
                ひとつ後ろへ
            </Button>
            <Button
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    app.canvasStateStore.sendToBack();
                }}
            >
                最背面へ
            </Button>
        </Card.Section>
    );
}
