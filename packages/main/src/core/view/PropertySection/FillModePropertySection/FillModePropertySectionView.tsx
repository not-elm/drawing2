import { colorPropertySection } from "../../../../instance";
import type { StateOf } from "../../../../lib/Store";
import { CardSection } from "../../../../react/Card";
import { useStore } from "../../../../react/hooks/useStore";
import { ColorPaletteBackground, Colors } from "../../../model/Colors";
import type { FillMode } from "../../../model/FillMode";
import { PropertyPanelButton } from "../PropertyPanelButton";
import type { FillModePropertySection } from "./FillModePropertySection";

export function FillModePropertySectionView({
    controller,
    state,
}: {
    controller: FillModePropertySection;
    state: StateOf<FillModePropertySection>;
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
                    display: "grid",
                    gap: 4,
                    gridTemplateColumns: "repeat(3, 1fr)",
                }}
            >
                <ColorButton
                    fillMode="none"
                    title="透明"
                    controller={controller}
                    state={state}
                />
                <ColorButton
                    fillMode="mono"
                    title="モノクロで塗りつぶし"
                    controller={controller}
                    state={state}
                />
                <ColorButton
                    fillMode="color"
                    title="同系色で塗りつぶし"
                    controller={controller}
                    state={state}
                />
            </div>
        </CardSection>
    );
}

function ColorButton({
    fillMode,
    title,
    controller,
    state,
}: {
    fillMode: FillMode;
    title: string;
    controller: FillModePropertySection;
    state: StateOf<FillModePropertySection>;
}) {
    const selected = state.selectedFillMode === fillMode;

    const colorSection = useStore(colorPropertySection());
    const colorId = colorSection.selectedColorId ?? colorSection.defaultColorId;

    return (
        <PropertyPanelButton
            onPointerDown={(ev) => {
                ev.stopPropagation();
                controller.setFillMode(fillMode);
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
                    }[fillMode],
                },
            }}
        />
    );
}
