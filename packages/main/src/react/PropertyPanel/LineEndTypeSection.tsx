import { useController } from "../ControllerProvider";
import { useStore } from "../hooks/useStore";
import { PropertyPanelButton } from "./PropertyPanelButton";

export function LineEndTypeSection() {
    const controller = useController();
    const state = useStore(controller.propertyPanelStateStore);

    return (
        <div
            css={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "stretch",
                gap: 4,
                pointerEvents: "all",
            }}
        >
            <PropertyPanelButton
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    controller.setLineEndType(1, "none");
                }}
            >
                <span
                    style={{
                        transform: "scaleX(-1)",
                    }}
                    className="material-symbols-outlined"
                >
                    line_end
                </span>
            </PropertyPanelButton>
            <PropertyPanelButton
                onPointerDown={(ev) => {
                    ev.stopPropagation();
                    controller.setLineEndType(1, "arrow");
                }}
            >
                <span
                    style={{
                        transform: "scaleX(-1)",
                    }}
                    className="material-symbols-outlined"
                >
                    line_end_arrow_notch
                </span>
            </PropertyPanelButton>
        </div>
    );
}
