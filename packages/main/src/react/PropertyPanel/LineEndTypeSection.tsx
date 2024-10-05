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
                flexDirection: "row",
                justifyContent: "center",
            }}
        >
            <div
                css={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, auto)",
                    gridTemplateRows: "repeat(2, auto)",
                    columnGap: 32,
                    rowGap: 4,
                }}
            >
                <PropertyPanelButton
                    onPointerDown={(ev) => {
                        ev.stopPropagation();
                        controller.setLineEndType(1, "none");
                    }}
                    aria-selected={state.lineEndType1 === "none"}
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
                        controller.setLineEndType(2, "none");
                    }}
                    aria-selected={state.lineEndType2 === "none"}
                >
                    <span className="material-symbols-outlined">line_end</span>
                </PropertyPanelButton>
                <PropertyPanelButton
                    onPointerDown={(ev) => {
                        ev.stopPropagation();
                        controller.setLineEndType(1, "arrow");
                    }}
                    aria-selected={state.lineEndType1 === "arrow"}
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
                <PropertyPanelButton
                    onPointerDown={(ev) => {
                        ev.stopPropagation();
                        controller.setLineEndType(2, "arrow");
                    }}
                    aria-selected={state.lineEndType2 === "arrow"}
                >
                    <span className="material-symbols-outlined">
                        line_end_arrow_notch
                    </span>
                </PropertyPanelButton>
            </div>
        </div>
    );
}
