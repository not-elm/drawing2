import type { StateOf } from "../../../../lib/Store";
import { CardSection } from "../../../../react/Card";
import type { TextAlignment } from "../../../model/TextAlignment";
import type { TextAlignmentPropertySection } from "./TextAlignmentPropertySection";

export function TextAlignmentPropertySectionView({
    controller,
    state,
}: {
    controller: TextAlignmentPropertySection;
    state: StateOf<TextAlignmentPropertySection>;
}) {
    if (!state.visible) return null;

    return (
        <CardSection
            css={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
            }}
        >
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
                <TextAlignButton
                    controller={controller}
                    state={state}
                    alignX="start"
                    alignY="start-outside"
                />
                <TextAlignButton
                    controller={controller}
                    state={state}
                    alignX="center"
                    alignY="start-outside"
                />
                <TextAlignButton
                    controller={controller}
                    state={state}
                    alignX="end"
                    alignY="start-outside"
                />
                <TextAlignButton
                    controller={controller}
                    state={state}
                    alignX="start"
                    alignY="start"
                />
                <TextAlignButton
                    controller={controller}
                    state={state}
                    alignX="center"
                    alignY="start"
                />
                <TextAlignButton
                    controller={controller}
                    state={state}
                    alignX="end"
                    alignY="start"
                />
                <TextAlignButton
                    controller={controller}
                    state={state}
                    alignX="start"
                    alignY="center"
                />
                <TextAlignButton
                    controller={controller}
                    state={state}
                    alignX="center"
                    alignY="center"
                />
                <TextAlignButton
                    controller={controller}
                    state={state}
                    alignX="end"
                    alignY="center"
                />
                <TextAlignButton
                    controller={controller}
                    state={state}
                    alignX="start"
                    alignY="end"
                />
                <TextAlignButton
                    controller={controller}
                    state={state}
                    alignX="center"
                    alignY="end"
                />
                <TextAlignButton
                    controller={controller}
                    state={state}
                    alignX="end"
                    alignY="end"
                />
                <TextAlignButton
                    controller={controller}
                    state={state}
                    alignX="start"
                    alignY="end-outside"
                />
                <TextAlignButton
                    controller={controller}
                    state={state}
                    alignX="center"
                    alignY="end-outside"
                />
                <TextAlignButton
                    controller={controller}
                    state={state}
                    alignX="end"
                    alignY="end-outside"
                />
            </div>
        </CardSection>
    );
}

function TextAlignButton({
    alignX,
    alignY,
    controller,
    state,
}: {
    alignX: TextAlignment;
    alignY: TextAlignment;
    controller: TextAlignmentPropertySection;
    state: StateOf<TextAlignmentPropertySection>;
}) {
    const selected =
        state.selectedAlignX === alignX && state.selectedAlignY === alignY;

    return (
        <button
            type="button"
            onPointerDown={(ev) => {
                ev.stopPropagation();
                controller.setTextAlign(alignX, alignY);
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