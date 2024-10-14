import { PropertyKey } from "../../core/model/PropertyKey";
import { useApp } from "../useApp";

import type { StrokeStyle } from "../../core/model/StrokeStyle";
import { Button } from "../Button";
import { Card } from "../Card";
import { useSelectedPropertyValue } from "./useSelectedPropertyValue";

export function StrokeStylePropertySection() {
    const app = useApp();
    const selectedValue = useSelectedPropertyValue(PropertyKey.STROKE_STYLE);

    const handleClick = (strokeStyle: StrokeStyle) => {
        app.canvasStateStore.edit((tx) => {
            tx.updateProperty(
                app.canvasStateStore.getState().selectedEntityIds,
                PropertyKey.STROKE_STYLE,
                strokeStyle,
            );
        });
        app.defaultPropertyStore.set(PropertyKey.STROKE_STYLE, strokeStyle);
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
