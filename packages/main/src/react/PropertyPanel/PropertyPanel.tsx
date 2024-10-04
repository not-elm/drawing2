import { Card } from "../Card";
import { useController } from "../ControllerProvider";
import { useStore } from "../hooks/useStore";
import { ColorSection } from "./ColorSection";
import { FillModeSection } from "./FillModeSection";
import { OrderSection } from "./OrderSection";
import { TextAlignmentSection } from "./TextAlignmentSection";

export function PropertyPanel() {
    const controller = useController();
    const state = useStore(controller.propertyPanelStateStore);

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
