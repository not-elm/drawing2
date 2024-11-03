import { NewPathModeController } from "../../default/mode/NewPathModeController";
import { NewShapeModeController } from "../../default/mode/NewShapeModeController";
import { PROPERTY_KEY_STROKE_WIDTH } from "../../default/property/StrokeWidth";
import { Button } from "../Button";
import { Card } from "../Card";
import { useApp } from "../hooks/useApp";
import { useSelectedPropertyValue } from "./useSelectedPropertyValue";
import { useVisibleFlag } from "./useVisibleFlag";

export function StrokeWidthPropertySection() {
    const app = useApp();
    const selectedValue = useSelectedPropertyValue(PROPERTY_KEY_STROKE_WIDTH);

    const handleClick = (strokeWidth: number) => {
        app.history.addCheckpoint();
        app.updatePropertyForSelectedEntities(
            PROPERTY_KEY_STROKE_WIDTH,
            strokeWidth,
        );
        app.setSelectedPropertyValue(PROPERTY_KEY_STROKE_WIDTH, strokeWidth);
    };

    const visible = useVisibleFlag({
        modes: [NewPathModeController.type, NewShapeModeController.type],
        propertyKeys: [PROPERTY_KEY_STROKE_WIDTH],
    });
    if (!visible) return null;

    return (
        <Card.Section css={{ flexDirection: "row", gap: 4 }}>
            <StrokeWidthButton width={4} />
            <StrokeWidthButton width={8} />
            <StrokeWidthButton width={16} />
        </Card.Section>
    );
}

function StrokeWidthButton({ width }: { width: number }) {
    const app = useApp();
    const handleClick = (strokeWidth: number) => {
        app.history.addCheckpoint();
        app.updatePropertyForSelectedEntities(
            PROPERTY_KEY_STROKE_WIDTH,
            strokeWidth,
        );
        app.setSelectedPropertyValue(PROPERTY_KEY_STROKE_WIDTH, strokeWidth);
    };
    const selectedValue = useSelectedPropertyValue(PROPERTY_KEY_STROKE_WIDTH);

    return (
        <Button
            onPointerDown={(ev) => {
                ev.stopPropagation();
                handleClick(width);
            }}
            aria-selected={selectedValue === width}
            title={`${width}px`}
        >
            <svg viewBox="0 0 32 32" width={32} height={32}>
                <circle
                    cx={16}
                    cy={16}
                    r={Math.min(width, 16) / 2}
                    fill="#000"
                    stroke="none"
                />
            </svg>
        </Button>
    );
}
