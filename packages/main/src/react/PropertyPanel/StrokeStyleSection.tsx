import type { StrokeStyle } from "../../core/model/StrokeStyle";
import { CardSection } from "../Card";
import { useController } from "../ControllerProvider";
import { useStore } from "../hooks/useStore";
import { PropertyPanelButton } from "./PropertyPanelButton";

export function StrokeStyleSection() {
    const controller = useController();
    const state = useStore(controller.propertyPanelStateStore);

    const setStrokeStyle = (strokeStyle: StrokeStyle) => {
        controller.canvasStateStore.setStrokeStyle(strokeStyle);
        controller.appStateStore.setDefaultStrokeStyle(strokeStyle);
    };

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
                    setStrokeStyle("solid");
                }}
                aria-selected={state.strokeStyle === "solid"}
            >
                実線
            </PropertyPanelButton>
            <PropertyPanelButton
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    setStrokeStyle("dashed");
                }}
                aria-selected={state.strokeStyle === "dashed"}
            >
                破線
            </PropertyPanelButton>
            <PropertyPanelButton
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    setStrokeStyle("dotted");
                }}
                aria-selected={state.strokeStyle === "dotted"}
            >
                点線
            </PropertyPanelButton>
        </CardSection>
    );
}
