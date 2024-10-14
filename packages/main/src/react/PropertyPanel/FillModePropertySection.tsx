import { PropertyKey } from "../../core/model/PropertyKey";
import { useApp } from "../useApp";

import {
    type ColorId,
    ColorPaletteBackground,
    Colors,
} from "../../core/model/Colors";
import type { FillStyle } from "../../core/model/FillStyle";
import { Button } from "../Button";
import { Card } from "../Card";
import { useSelectedPropertyValue } from "./useSelectedPropertyValue";

export function FillModePropertySection() {
    const app = useApp();
    const selectedValue = useSelectedPropertyValue(PropertyKey.FILL_STYLE);

    const handleClick = (fillStyle: FillStyle) => {
        app.canvasStateStore.edit((tx) => {
            tx.updateProperty(
                app.canvasStateStore.getState().selectedEntityIds,
                PropertyKey.FILL_STYLE,
                fillStyle,
            );
        });
        app.defaultPropertyStore.set(PropertyKey.FILL_STYLE, fillStyle);
    };

    return (
        <Card.Section css={{ flexDirection: "row" }}>
            <ColorButton
                fillStyle="none"
                title="透明"
                selected={selectedValue === "none"}
                onClick={handleClick}
            />
            <ColorButton
                fillStyle="mono"
                title="モノクロで塗りつぶし"
                selected={selectedValue === "mono"}
                onClick={handleClick}
            />
            <ColorButton
                fillStyle="color"
                title="同系色で塗りつぶし"
                selected={selectedValue === "color"}
                onClick={handleClick}
            />
        </Card.Section>
    );
}

function ColorButton({
    fillStyle,
    title,
    selected,
    onClick,
}: {
    fillStyle: FillStyle;
    selected: boolean;
    title: string;
    onClick: (fillStyle: FillStyle) => void;
}) {
    const colorId =
        useSelectedPropertyValue<ColorId>(PropertyKey.COLOR_ID) ?? 0;

    return (
        <Button
            onPointerDown={(ev) => {
                ev.stopPropagation();
                onClick(fillStyle);
            }}
            title={title}
            aria-selected={selected}
            css={{
                "&::after": {
                    content: '""',
                    position: "absolute",
                    inset: "8px",
                    borderRadius: "50%",
                    border: "2px solid",
                    borderColor: Colors[colorId],
                    ...{
                        none: { borderStyle: "dashed", opacity: 0.3 },
                        mono: { background: "#fff" },
                        color: { background: ColorPaletteBackground[colorId] },
                    }[fillStyle],
                },
            }}
        />
    );
}
