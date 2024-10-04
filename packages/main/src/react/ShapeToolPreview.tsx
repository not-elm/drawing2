import { getRectanglePath } from "../geo/path";
import type { ShapeObject } from "../model/Page";
import type { PointerEventSessionData } from "../service/GestureRecognizer";
import { useCanvasState } from "./CanvasStateStoreProvider";
import { ShapeView } from "./ShapeView";

export function ShapeToolPreview({ data }: { data: PointerEventSessionData }) {
    const state = useCanvasState();

    const shape: ShapeObject = {
        type: "shape",
        id: "shape-tool-preview",
        x: Math.min(data.startX, data.lastX),
        y: Math.min(data.startY, data.lastY),
        width: Math.abs(data.lastX - data.startX),
        height: Math.abs(data.lastY - data.startY),
        label: "",
        textAlignX: state.defaultTextAlignX,
        textAlignY: state.defaultTextAlignY,
        colorId: state.defaultColorId,
        fillMode: state.defaultFillMode,
        path: getRectanglePath(),
    };

    return <ShapeView shape={shape} isLabelEditing={false} />;
}
