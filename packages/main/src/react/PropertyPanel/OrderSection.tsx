import { Button } from "../Button";
import { Card } from "../Card";
import { useApp } from "../useApp";

export function OrderSection() {
    const app = useApp();

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
