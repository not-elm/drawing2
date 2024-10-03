import { ColorPaletteBackground, Colors } from "../../model/Colors";
import type { FillMode } from "../../model/FillMode";
import { useCanvasState } from "../CanvasStateStoreProvider";
import { CardSection } from "../Card";
import { useController } from "../ControllerProvider";

export function FillModeSection() {
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
                    display: "grid",
                    gap: 4,
                    gridTemplateColumns: "repeat(3, 1fr)",
                }}
            >
                <ColorButton fillMode="none" title="透明" />
                <ColorButton fillMode="mono" title="モノクロで塗りつぶし" />
                <ColorButton fillMode="color" title="同系色で塗りつぶし" />
            </div>
        </CardSection>
    );
}

function ColorButton({
    fillMode,
    title,
}: { fillMode: FillMode; title: string }) {
    const state = useCanvasState();
    const propertyPanelState = state.getPropertyPanelState();
    const handlers = useController();
    const selected = propertyPanelState.fillMode === fillMode;

    const colorId = propertyPanelState.colorId ?? state.defaultColorId;

    return (
        <button
            onPointerDown={(ev) => {
                ev.stopPropagation();
                handlers.handleFillModeButtonClick(fillMode);
            }}
            type="button"
            title={title}
            aria-selected={selected}
            css={{
                position: "relative",
                border: "none",
                background: "none",
                width: "32px",
                height: "32px",
                borderRadius: 8,
                transition: "background 0.2s",
                cursor: "pointer",
                pointerEvents: "all",

                "&:hover": {
                    transition: "background 0.1s",
                    background: "#f2f2f2",
                },

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
                    }[fillMode],
                },

                "&[aria-selected='true']": {
                    background: "#f2f2f2",
                },
            }}
        />
    );
}
