import { getRectanglePath } from "../geo/path";
import type { ShapeObject } from "../model/Page";
import type { PointerEventSessionData } from "../service/GestureRecognizer";
import { useController } from "./ControllerProvider";
import { ShapeView } from "./ShapeView";
import { useStore } from "./hooks/useStore";

export function ShapeToolPreview({ data }: { data: PointerEventSessionData }) {
    const controller = useController();
    const appState = useStore(controller.appStateStore);

    const shape: ShapeObject = {
        type: "shape",
        id: "shape-tool-preview",
        x: Math.min(data.startX, data.lastX),
        y: Math.min(data.startY, data.lastY),
        width: Math.abs(data.lastX - data.startX),
        height: Math.abs(data.lastY - data.startY),
        label: "",
        textAlignX: appState.defaultTextAlignX,
        textAlignY: appState.defaultTextAlignY,
        colorId: appState.defaultColorId,
        fillMode: appState.defaultFillMode,
        path: getRectanglePath(),
    };

    return <ShapeView shape={shape} isLabelEditing={false} />;
}
