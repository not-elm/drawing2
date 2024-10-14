import type { StateOf } from "../../../../lib/Store";
import { CardSection } from "../../../../react/Card";
import { useStore } from "../../../../react/hooks/useStore";
import { type ColorId, Colors } from "../../../model/Colors";
import { PropertyPanelButton } from "../PropertyPanelButton";
import type { ColorPropertySection } from "./ColorPropertySection";

export function ColorPropertySectionView({
    controller,
    state,
}: {
    controller: ColorPropertySection;
    state: StateOf<ColorPropertySection>;
}) {
    if (!state.visible) {
        return null;
    }

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
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gridTemplateRows: "repeat(3, 1fr)",
                }}
            >
                <ColorButton controller={controller} colorId={0} />
                <ColorButton controller={controller} colorId={1} />
                <ColorButton controller={controller} colorId={2} />
                <ColorButton controller={controller} colorId={3} />
                <ColorButton controller={controller} colorId={4} />
                <ColorButton controller={controller} colorId={5} />
                <ColorButton controller={controller} colorId={6} />
                <ColorButton controller={controller} colorId={7} />
                <ColorButton controller={controller} colorId={8} />
                <ColorButton controller={controller} colorId={9} />
                <ColorButton controller={controller} colorId={10} />
                <ColorButton controller={controller} colorId={11} />
            </div>
        </CardSection>
    );
}

function ColorButton({
    colorId,
    controller,
}: { colorId: ColorId; controller: ColorPropertySection }) {
    const state = useStore(controller);
    const selected = state.selectedColorId === colorId;

    return (
        <PropertyPanelButton
            onPointerDown={(ev) => {
                ev.stopPropagation();
                controller.setColor(colorId);
            }}
            aria-selected={selected}
            css={{
                "&::after": {
                    content: '""',
                    position: "absolute",
                    inset: "8px",
                    borderRadius: "50%",
                    background: Colors[colorId],
                },
            }}
        />
    );
}
