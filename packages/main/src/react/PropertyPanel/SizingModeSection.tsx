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
                aria-selected={state.textEntitySizingMode === "content"}
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    controller.setTextEntitySizingMode("content");
                }}
            >
                内容に合わせて自動調整
            </PropertyPanelButton>
            <PropertyPanelButton
                aria-selected={state.textEntitySizingMode === "fixed"}
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    controller.setTextEntitySizingMode("fixed");
                }}
            >
                幅を固定
            </PropertyPanelButton>
        </CardSection>
    );
}
