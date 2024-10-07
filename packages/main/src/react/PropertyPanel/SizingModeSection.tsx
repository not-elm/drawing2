import { CardSection } from "../Card";
import { useController } from "../ControllerProvider";
import { useStore } from "../hooks/useStore";
import { PropertyPanelButton } from "./PropertyPanelButton";

export function SizingModeSection() {
    const controller = useController();
    const state = useStore(controller.propertyPanelStateStore);

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
                aria-selected={state.textBlockSizingMode === "content"}
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    controller.setTextBlockSizingMode("content");
                }}
            >
                内容に合わせて自動調整
            </PropertyPanelButton>
            <PropertyPanelButton
                aria-selected={state.textBlockSizingMode === "fixed"}
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    controller.setTextBlockSizingMode("fixed");
                }}
            >
                幅を固定
            </PropertyPanelButton>
        </CardSection>
    );
}
