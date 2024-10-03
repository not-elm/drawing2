import {
    type PointerEventHandler,
    type WheelEventHandler,
    useCallback,
    useEffect,
    useReducer,
} from "react";
import { useCanvasState } from "./CanvasStateStoreProvider";
import { useController } from "./ControllerProvider";
import { LineView } from "./LineView";
import { SelectionRect } from "./SelectionRect";
import { SelectorRect } from "./SelectorRect";
import { ShapeView } from "./ShapeView";
import { ToolPreview } from "./ToolPreview";
import { useStore } from "./hooks/useStore";

export function Canvas() {
    const [logs, addLog] = useReducer(
        (logs: string[], log: string) => [...logs, log].slice(-5),
        [],
    );
    const state = useCanvasState();
    const controller = useController();
    const viewport = useStore(controller.viewportStore);

    useEffect(() => {
        function handlePointerMove(ev: PointerEvent) {
            ev.stopPropagation();
            controller.handleCanvasMouseMove(ev.clientX, ev.clientY);
        }
        function handlePointerUp(ev: PointerEvent) {
            ev.stopPropagation();
            controller.handleCanvasMouseUp();
        }
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);

        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, [controller]);

    const handleWheel: WheelEventHandler = useCallback(
        (ev) => {
            if (ev.ctrlKey) {
                controller.handleScale(
                    Math.min(
                        Math.max(0.1, viewport.scale - ev.deltaY * 0.0005),
                        4,
                    ),
                    ev.clientX,
                    ev.clientY,
                );
            } else {
                controller.handleScroll(ev.deltaX, ev.deltaY);
            }
        },
        [controller, viewport.scale],
    );

    const handleCanvasPointerDown: PointerEventHandler = useCallback(
        (ev) => {
            ev.stopPropagation();
            controller.handleCanvasMouseDown(
                ev.clientX,
                ev.clientY,
                ev.button,
                {
                    shiftKey: ev.shiftKey,
                },
            );
        },
        [controller],
    );

    const scale = viewport.scale;

    return (
        <div
            css={{
                position: "fixed",
                inset: 0,
                overflow: "clip",
                pointerEvents: "all",
            }}
            onWheel={handleWheel}
            onPointerDown={handleCanvasPointerDown}
        >
            <div
                css={{
                    position: "relative",
                    transform: `translate(${-viewport.x}px, ${-viewport.y}px) scale(${scale})`,
                    transformOrigin: `${viewport.x}px ${viewport.y}px`,
                }}
            >
                {state.page.objectIds.map((objectId) => {
                    const object = state.page.objects[objectId];
                    if (object === undefined) return null;

                    if (object.type === "shape") {
                        return (
                            <ShapeView
                                key={object.id}
                                shape={object}
                                isLabelEditing={state.isTextEditing(object.id)}
                            />
                        );
                    }

                    if (object.type === "line") {
                        return <LineView key={object.id} line={object} />;
                    }

                    return null;
                })}
                <ToolPreview />
            </div>

            <SelectorRect />
            <SelectionRect />
            <PointHighlightLayer />
        </div>
    );
}

function PointHighlightLayer() {
    const controller = useController();
    const viewport = useStore(controller.viewportStore);
    const { nearestPoint } = useStore(controller.hoverStateStore);

    return (
        <div
            css={{
                position: "absolute",
                inset: 0,
            }}
        >
            <svg
                viewBox="0 0 1 1"
                width={1}
                height={1}
                css={{ overflow: "visible" }}
            >
                {nearestPoint !== null && (
                    <circle
                        r={8}
                        cx={(nearestPoint.x - viewport.x) * viewport.scale}
                        cy={(nearestPoint.y - viewport.y) * viewport.scale}
                        css={{ fill: "var(--color-selection)", opacity: 0.3 }}
                    />
                )}
            </svg>
        </div>
    );
}
