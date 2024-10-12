import { CardSection } from "../Card";
import { useController } from "../ControllerProvider";
import { PropertyPanelButton } from "./PropertyPanelButton";

export function OrderSection() {
    const controller = useController();

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
                    controller.canvasStateStore.bringToFront();
                }}
            >
                最前面へ
            </PropertyPanelButton>
            <PropertyPanelButton
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    controller.canvasStateStore.bringForward();
                }}
            >
                ひとつ前へ
            </PropertyPanelButton>
            <PropertyPanelButton
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    controller.canvasStateStore.sendBackward();
                }}
            >
                ひとつ後ろへ
            </PropertyPanelButton>
            <PropertyPanelButton
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    controller.canvasStateStore.sendToBack();
                }}
            >
                最背面へ
            </PropertyPanelButton>
        </CardSection>
    );
}
