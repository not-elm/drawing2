import type { StateOf } from "../../../../lib/Store";
import { CardSection } from "../../../../react/Card";
import { PropertyPanelButton } from "../PropertyPanelButton";
import type { OrderPropertySection } from "./OrderPropertySection";

export function OrderPropertySectionView({
    controller,
    state,
}: { controller: OrderPropertySection; state: StateOf<OrderPropertySection> }) {
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
                    controller.bringToFront();
                }}
            >
                最前面へ
            </PropertyPanelButton>
            <PropertyPanelButton
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    controller.bringForward();
                }}
            >
                ひとつ前へ
            </PropertyPanelButton>
            <PropertyPanelButton
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    controller.sendBackward();
                }}
            >
                ひとつ後ろへ
            </PropertyPanelButton>
            <PropertyPanelButton
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    controller.sendToBack();
                }}
            >
                最背面へ
            </PropertyPanelButton>
        </CardSection>
    );
}
