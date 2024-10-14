import type { StateOf } from "../../../../lib/Store";
import { CardSection } from "../../../../react/Card";
import { PropertyPanelButton } from "../PropertyPanelButton";
import type { StrokeStylePropertySection } from "./StrokeStylePropertySection";

export function StrokeStylePropertySectionView({
    controller,
    state,
}: {
    controller: StrokeStylePropertySection;
    state: StateOf<StrokeStylePropertySection>;
}) {
    if (!state.visible) return null;

    return (
        <CardSection
            css={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "stretch",
                gap: 4,
                pointerEvents: "all",
            }}
            onPointerDown={(ev) => {
                ev.stopPropagation();
            }}
        >
            <PropertyPanelButton
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    controller.setStrokeStyle("solid");
                }}
                aria-selected={state.selectedStrokeStyle === "solid"}
            >
                実線
            </PropertyPanelButton>
            <PropertyPanelButton
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    controller.setStrokeStyle("dashed");
                }}
                aria-selected={state.selectedStrokeStyle === "dashed"}
            >
                破線
            </PropertyPanelButton>
            <PropertyPanelButton
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    controller.setStrokeStyle("dotted");
                }}
                aria-selected={state.selectedStrokeStyle === "dotted"}
            >
                点線
            </PropertyPanelButton>
        </CardSection>
    );
}
