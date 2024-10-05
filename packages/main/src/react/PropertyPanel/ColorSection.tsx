import { type ColorId, Colors } from "../../model/Colors";
import { CardSection } from "../Card";
import { useController } from "../ControllerProvider";
import { useStore } from "../hooks/useStore";
import { PropertyPanelButton } from "./PropertyPanelButton";

export function ColorSection() {
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
                <ColorButton colorId={0} />
                <ColorButton colorId={1} />
                <ColorButton colorId={2} />
                <ColorButton colorId={3} />
                <ColorButton colorId={4} />
                <ColorButton colorId={5} />
                <ColorButton colorId={6} />
                <ColorButton colorId={7} />
                <ColorButton colorId={8} />
                <ColorButton colorId={9} />
                <ColorButton colorId={10} />
                <ColorButton colorId={11} />
            </div>
        </CardSection>
    );
}

function ColorButton({ colorId }: { colorId: ColorId }) {
    const controller = useController();
    const state = useStore(controller.propertyPanelStateStore);
    const selected = state.colorId === colorId;

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
