import { useApp } from "../hooks/useApp";

import { NewShapeModeController } from "../../default/mode/NewShapeModeController";
import {
    type ColorId,
    ColorPaletteBackground,
    Colors,
    PROPERTY_KEY_COLOR_ID,
} from "../../default/property/Colors";
import {
    type FillStyle,
    PROPERTY_KEY_FILL_STYLE,
} from "../../default/property/FillStyle";
import { Button } from "../Button";
import { Card } from "../Card";
import { useSelectedPropertyValue } from "./useSelectedPropertyValue";
import { useVisibleFlag } from "./useVisibleFlag";

export function FillModePropertySection() {
    const app = useApp();
    const selectedValue = useSelectedPropertyValue(PROPERTY_KEY_FILL_STYLE);

    const handleClick = (fillStyle: FillStyle) => {
        app.history.addCheckpoint();
        app.updatePropertyForSelectedEntities(
            PROPERTY_KEY_FILL_STYLE,
            fillStyle,
        );
        app.setSelectedPropertyValue(PROPERTY_KEY_FILL_STYLE, fillStyle);
    };

    const visible = useVisibleFlag({
        modes: [NewShapeModeController.type],
        propertyKeys: [PROPERTY_KEY_FILL_STYLE],
    });
    if (!visible) return null;

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
        useSelectedPropertyValue<ColorId>(PROPERTY_KEY_COLOR_ID) ?? 0;

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
