import type { LineObject } from "../model/Page";
import type { PointerEventSessionData } from "../service/GestureRecognizer";
import { useCanvasState } from "./CanvasStateStoreProvider";
import { LineView } from "./LineView";

export function LineToolPreview({ data }: { data: PointerEventSessionData }) {
    const state = useCanvasState();

    const line: LineObject = {
        type: "line",
        id: "line-tool-preview",
        x1: data.startX,
        y1: data.startY,
        x2: data.lastX,
        y2: data.lastY,
        colorId: state.defaultColorId,
    };

    return <LineView line={line} />;
}
