import { NewPathModeController } from "../../default/mode/NewPathModeController";
import { NewShapeModeController } from "../../default/mode/NewShapeModeController";
import {
    PROPERTY_KEY_STROKE_STYLE,
    type StrokeStyle,
} from "../../default/property/StrokeStyle";
import { Button } from "../Button";
import { Card } from "../Card";
import { useApp } from "../useApp";
import { useSelectedPropertyValue } from "./useSelectedPropertyValue";
import { useVisibleFlag } from "./useVisibleFlag";

export function StrokeStylePropertySection() {
    const app = useApp();
    const selectedValue = useSelectedPropertyValue(PROPERTY_KEY_STROKE_STYLE);

    const handleClick = (strokeStyle: StrokeStyle) => {
        app.updatePropertyForSelectedEntities(
            PROPERTY_KEY_STROKE_STYLE,
            strokeStyle,
        );
        app.setSelectedPropertyValue(PROPERTY_KEY_STROKE_STYLE, strokeStyle);
    };

    const visible = useVisibleFlag({
        modes: [NewPathModeController.type, NewShapeModeController.type],
        propertyKeys: [PROPERTY_KEY_STROKE_STYLE],
    });
    if (!visible) return null;

    return (
        <Card.Section>
            <Button
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    handleClick("solid");
                }}
                aria-selected={selectedValue === "solid"}
            >
                <svg width={66} height={4} css={{ overflow: "visible" }}>
                    <path
                        d="M0 2h66"
                        css={{
                            stroke: "currentColor",
                            strokeLinecap: "round",
                            strokeWidth: 4,
                        }}
                    />
                </svg>
            </Button>
            <Button
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    handleClick("dashed");
                }}
                aria-selected={selectedValue === "dashed"}
            >
                <svg width={66} height={4} css={{ overflow: "visible" }}>
                    <path
                        d="M0 2h66"
                        css={{
                            stroke: "currentColor",
                            strokeLinecap: "round",
                            strokeWidth: 4,
                        }}
                        strokeDasharray={"6 6"}
                    />
                </svg>
            </Button>
            <Button
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    handleClick("dotted");
                }}
                aria-selected={selectedValue === "dotted"}
            >
                <svg width={66} height={4} css={{ overflow: "visible" }}>
                    <path
                        d="M0 2h66"
                        css={{
                            stroke: "currentColor",
                            strokeLinecap: "round",
                            strokeWidth: 4,
                        }}
                        strokeDasharray={"0 8"}
                    />
                </svg>
            </Button>
        </Card.Section>
    );
}
