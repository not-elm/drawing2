import {
    PROPERTY_KEY_TEXT_ALIGNMENT_X,
    PROPERTY_KEY_TEXT_ALIGNMENT_Y,
    type TextAlignment,
} from "../../default/property/TextAlignment";
import { Card } from "../Card";
import { useApp } from "../useApp";

import { useSelectedPropertyValue } from "./useSelectedPropertyValue";
import { useVisibleFlag } from "./useVisibleFlag";

const ALIGNMENT_OPTION_X = ["start", "center", "end"] as const;
const ALIGNMENT_OPTION_Y = [
    "start-outside",
    "start",
    "center",
    "end",
    "end-outside",
] as const;

export function TextAlignmentPropertySection() {
    const app = useApp();
    const selectedX = useSelectedPropertyValue(PROPERTY_KEY_TEXT_ALIGNMENT_X);
    const selectedY =
        useSelectedPropertyValue(PROPERTY_KEY_TEXT_ALIGNMENT_Y) ?? "center";

    const handleClick = (
        alignmentX: TextAlignment,
        alignmentY: TextAlignment,
    ) => {
        app.updatePropertyForSelectedEntities(
            PROPERTY_KEY_TEXT_ALIGNMENT_X,
            alignmentX,
        );
        app.updatePropertyForSelectedEntities(
            PROPERTY_KEY_TEXT_ALIGNMENT_Y,
            alignmentY,
        );
        app.defaultPropertyStore.set(PROPERTY_KEY_TEXT_ALIGNMENT_X, alignmentX);
        app.defaultPropertyStore.set(PROPERTY_KEY_TEXT_ALIGNMENT_Y, alignmentY);
    };

    const visible = useVisibleFlag({
        modes: ["new-text"],
        propertyKeys: [
            PROPERTY_KEY_TEXT_ALIGNMENT_X,
            PROPERTY_KEY_TEXT_ALIGNMENT_Y,
        ],
    });
    if (!visible) return null;

    return (
        <Card.Section css={{ flexDirection: "row" }}>
            <div
                css={{
                    position: "relative",
                    border: "1px solid #d0d0d0",
                    borderRadius: "6px",
                    width: "96px",
                    height: "96px",
                    margin: "32px 0",
                }}
            >
                {ALIGNMENT_OPTION_Y.map((alignY) =>
                    ALIGNMENT_OPTION_X.map((alignX) => (
                        <TextAlignButton
                            key={`${alignX}-${alignY}`}
                            onClick={handleClick}
                            selected={
                                selectedX === alignX && selectedY === alignY
                            }
                            alignX={alignX}
                            alignY={alignY}
                        />
                    )),
                )}
            </div>
        </Card.Section>
    );
}

function TextAlignButton({
    onClick,
    selected,
    alignX,
    alignY,
}: {
    onClick: (alignX: TextAlignment, alignY: TextAlignment) => void;
    selected: boolean;
    alignX: TextAlignment;
    alignY: TextAlignment;
}) {
    return (
        <button
            type="button"
            onPointerDown={(ev) => {
                ev.stopPropagation();
                onClick(alignX, alignY);
            }}
            aria-selected={selected}
            css={{
                position: "absolute",
                pointerEvents: "all",
                ...{
                    "start-outside": { right: "100%" },
                    start: { left: 0 },
                    center: { left: "calc(50% - 16px)" },
                    end: { right: 0 },
                    "end-outside": { left: "100%" },
                }[alignX],
                ...{
                    "start-outside": { bottom: "100%" },
                    start: { top: 0 },
                    center: { top: "calc(50% - 16px)" },
                    end: { bottom: 0 },
                    "end-outside": { top: "100%" },
                }[alignY],
                width: "32px",
                height: "32px",
                padding: 0,
                margin: 0,
                border: "none",
                cursor: "pointer",
                background: "none",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-ui-selected)",

                "&::after": {
                    position: "absolute",
                    inset: "12px",
                    content: '" "',
                    overflow: "hidden",
                    borderRadius: "50%",
                    background: "rgba(0, 0, 0, 0.1)",
                    transition: "background 0.2s",
                },

                "&:hover": {
                    "&::after": {
                        background: "rgba(0, 0, 0, 0.3)",
                    },
                },

                "&[aria-selected='true']": {
                    "&::after": {
                        display: "none",
                    },
                },
            }}
        >
            {selected && (
                <span
                    className="material-symbols-outlined"
                    css={{
                        fontSize: 30,
                    }}
                >
                    abc
                </span>
            )}
        </button>
    );
}
