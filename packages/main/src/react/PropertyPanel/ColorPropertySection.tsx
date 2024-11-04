import { Color } from "../../core/Color";
import {
    Colors,
    PROPERTY_KEY_STROKE_COLOR,
} from "../../default/property/Colors";
import { Button } from "../Button";
import { Card } from "../Card";
import { useApp } from "../hooks/useApp";
import { useSelectedPropertyValue } from "./useSelectedPropertyValue";

export function useSelectedColor() {
    return useSelectedPropertyValue<Color>(PROPERTY_KEY_STROKE_COLOR);
}

export function ColorPropertySection() {
    const app = useApp();
    const selectedColor = useSelectedColor();
    const handleClick = (color: Color) => {
        app.history.addCheckpoint();
        app.updatePropertyForSelectedEntities(PROPERTY_KEY_STROKE_COLOR, color);
        app.setSelectedPropertyValue(PROPERTY_KEY_STROKE_COLOR, color);
    };

    return (
        <Card.Section
            css={{
                display: "grid",
                gap: 4,
                width: "min-content",
                alignSelf: "center",
                gridTemplateColumns: "repeat(4, 1fr)",
                gridTemplateRows: "repeat(3, 1fr)",
            }}
        >
            {Colors.map((color) => (
                <ColorButton
                    key={Color.stringify(color)}
                    selected={
                        selectedColor !== null &&
                        Color.stringify(selectedColor) ===
                            Color.stringify(color)
                    }
                    onClick={handleClick}
                    color={color}
                />
            ))}
        </Card.Section>
    );
}

function ColorButton({
    selected,
    onClick,
    color,
}: {
    selected: boolean;
    onClick: (color: Color) => void;
    color: Color;
}) {
    return (
        <Button
            onPointerDown={(ev) => {
                ev.stopPropagation();
                onClick(color);
            }}
            aria-selected={selected}
            css={{
                "&::after": {
                    content: '""',
                    position: "absolute",
                    inset: "8px",
                    borderRadius: "50%",
                    background: Color.stringify(color),
                },
            }}
        />
    );
}
