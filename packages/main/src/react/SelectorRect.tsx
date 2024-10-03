import { useCanvasState } from "./CanvasStateStoreProvider";
import { useController } from "./ControllerProvider";
import { useStore } from "./hooks/useStore";

export function SelectorRect() {
    const controller = useController();
    const viewport = useStore(controller.viewportStore);
    const state = useCanvasState();

    const selectorRect = state.getSelectorRect();
    if (selectorRect === null) return null;

    return (
        <div
            css={{
                position: "absolute",
                left: (selectorRect.x - viewport.x) * viewport.scale,
                top: (selectorRect.y - viewport.y) * viewport.scale,
                width: selectorRect.width * viewport.scale,
                height: selectorRect.height * viewport.scale,
                background: "rgba(40, 40 ,40, 0.1)",
            }}
        />
    );
}
