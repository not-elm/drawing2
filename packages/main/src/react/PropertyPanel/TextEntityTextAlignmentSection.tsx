import type { TextAlignment } from "../../core/model/TextAlignment";
import { CardSection } from "../Card";
import { useController } from "../ControllerProvider";
import { useStore } from "../hooks/useStore";

export function TextEntityTextAlignmentSection() {
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
                    height: "32px",
                }}
            >
                <TextAlignButton alignment="start" />
                <TextAlignButton alignment="center" />
                <TextAlignButton alignment="end" />
            </div>
        </CardSection>
    );
}

function TextAlignButton({ alignment }: { alignment: TextAlignment }) {
    const controller = useController();
    const state = useStore(controller.propertyPanelStateStore);
    const selected = state.textEntityTextAlignment === alignment;

    return (
        <button
            type="button"
            onPointerDown={(ev) => {
                ev.stopPropagation();
                controller.canvasStateStore.setTextEntityTextAlignment(
                    alignment,
                );
                controller.appStateStore.setDefaultTextEntityTextAlignment(
                    alignment,
                );
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
                }[alignment],
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
