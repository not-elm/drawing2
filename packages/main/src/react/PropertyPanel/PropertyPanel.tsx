import { Card } from "../Card";
import { useController } from "../ControllerProvider";
import { useStore } from "../hooks/useStore";
import { ColorSection } from "./ColorSection";
import { FillModeSection } from "./FillModeSection";
import { LineEndTypeSection } from "./LineEndTypeSection";
import { OrderSection } from "./OrderSection";
import { SizingModeSection } from "./SizingModeSection";
import { StrokeStyleSection } from "./StrokeStyleSection";
import { TextAlignmentSection } from "./TextAlignmentSection";
import { TextBlockTextAlignmentSection } from "./TextBlockTextAlignmentSection";

export function PropertyPanel() {
    const controller = useController();
    const state = useStore(controller.propertyPanelStateStore);

    return (
        <Card
            css={{
                pointerEvents: "all",
                "> * + *": {
                    borderTop: "1px solid #f0f0f0",
                    marginTop: "8px",
                    paddingTop: "8px",
                },
            }}
            onPointerDown={(ev) => ev.stopPropagation()}
        >
            {state.colorSectionVisible && <ColorSection />}
            {state.fillModeSectionVisible && <FillModeSection />}
            {state.textAlignSectionVisible && <TextAlignmentSection />}
            {state.textBlockTextAlignmentSectionVisible && (
                <TextBlockTextAlignmentSection />
            )}
            {state.orderSectionVisible && <OrderSection />}
            {state.lineEndTypeSectionVisible && <LineEndTypeSection />}
            {state.textBlockSizingModeSectionVisible && <SizingModeSection />}
            {state.strokeStyleSectionVisible && <StrokeStyleSection />}
        </Card>
    );
}
