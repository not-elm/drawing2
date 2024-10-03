import { useCanvasState } from "../CanvasStateStoreProvider";
import { Card } from "../Card";
import { ColorSection } from "./ColorSection";
import { FillModeSection } from "./FillModeSection";
import { OrderSection } from "./OrderSection";
import { TextAlignmentSection } from "./TextAlignmentSection";

export function PropertyPanel() {
    const state = useCanvasState().getPropertyPanelState();

    return (
        <Card
            css={{
                pointerEvents: "all",
            }}
            onPointerDown={(ev) => ev.stopPropagation()}
        >
            {state.colorSectionVisible && <ColorSection />}
            {state.fillModeSectionVisible && <FillModeSection />}
            {state.textAlignSectionVisible && <TextAlignmentSection />}
            {state.orderSectionVisible && <OrderSection />}
        </Card>
    );
}
