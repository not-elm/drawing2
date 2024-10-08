import type { LineBlock } from "../model/Page";
import type { NewLinePointerEventSession } from "../service/PointerEventSession/NewLinePointerEventSession";
import type { PointerEventSessionData } from "../service/PointerEventSession/PointerEventSession";
import { useController } from "./ControllerProvider";
import { LineView } from "./LineView";
import { useStore } from "./hooks/useStore";

export function LineToolPreview({
    data,
    session,
}: {
    data: PointerEventSessionData;
    session: NewLinePointerEventSession;
}) {
    const controller = useController();
    const appState = useStore(controller.appStateStore);

    const line: LineBlock = {
        type: "line",
        id: "line-tool-preview",
        x1: data.startX,
        y1: data.startY,
        endType1: appState.defaultLineEndType1,
        x2: session.currentX,
        y2: session.currentY,
        endType2: appState.defaultLineEndType2,
        colorId: appState.defaultColorId,
        strokeStyle: appState.defaultStrokeStyle,
    };

    return <LineView line={line} />;
}
