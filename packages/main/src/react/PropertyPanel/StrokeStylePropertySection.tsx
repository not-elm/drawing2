import { useApp } from "../useApp";

import {
    PROPERTY_KEY_STROKE_STYLE,
    type StrokeStyle,
} from "../../default/property/StrokeStyle";
import { Button } from "../Button";
import { Card } from "../Card";
import { useSelectedPropertyValue } from "./useSelectedPropertyValue";

export function StrokeStylePropertySection() {
    const app = useApp();
    const selectedValue = useSelectedPropertyValue(PROPERTY_KEY_STROKE_STYLE);

    const handleClick = (strokeStyle: StrokeStyle) => {
        app.canvasStateStore.edit((tx) => {
            tx.updateProperty(
                app.canvasStateStore.getState().selectedEntityIds,
                PROPERTY_KEY_STROKE_STYLE,
                strokeStyle,
            );
        });
        app.defaultPropertyStore.set(PROPERTY_KEY_STROKE_STYLE, strokeStyle);
    };

    return (
        <Card.Section css={{ flexDirection: "row" }}>
            <Button
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    handleClick("solid");
                }}
                aria-selected={selectedValue === "solid"}
            >
                実線
            </Button>
            <Button
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    handleClick("dashed");
                }}
                aria-selected={selectedValue === "dashed"}
            >
                破線
            </Button>
            <Button
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    handleClick("dotted");
                }}
                aria-selected={selectedValue === "dotted"}
            >
                点線
            </Button>
        </Card.Section>
    );
}
