import { PROPERTY_KEY_STROKE_WIDTH } from "../../default/property/StrokeWidth";
import { Button } from "../Button";
import { Card } from "../Card";
import { useApp } from "../useApp";
import { useSelectedPropertyValue } from "./useSelectedPropertyValue";

export function StrokeWidthPropertySection() {
    const app = useApp();
    const selectedValue = useSelectedPropertyValue(PROPERTY_KEY_STROKE_WIDTH);

    const handleClick = (strokeWidth: number) => {
        app.canvasStateStore.edit((tx) => {
            tx.updateProperty(
                app.canvasStateStore.getState().selectedEntityIds,
                PROPERTY_KEY_STROKE_WIDTH,
                strokeWidth,
            );
        });
        app.defaultPropertyStore.set(PROPERTY_KEY_STROKE_WIDTH, strokeWidth);
    };

    return (
        <Card.Section css={{ flexDirection: "row", gap: 4 }}>
            <Button
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    handleClick(1);
                }}
                aria-selected={selectedValue === 1}
            >
                <span
                    css={{
                        display: "inline-block",
                        background: "#000",
                        borderRadius: "50%",
                        width: 8,
                        height: 8,
                    }}
                />
            </Button>
            <Button
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    handleClick(2);
                }}
                aria-selected={selectedValue === 2}
            >
                <span
                    css={{
                        display: "inline-block",
                        background: "#000",
                        borderRadius: "50%",
                        width: 16,
                        height: 16,
                    }}
                />
            </Button>
            <Button
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    handleClick(3);
                }}
                aria-selected={selectedValue === 3}
            >
                <span
                    css={{
                        display: "inline-block",
                        background: "#000",
                        borderRadius: "50%",
                        width: 24,
                        height: 24,
                    }}
                />
            </Button>
        </Card.Section>
    );
}
