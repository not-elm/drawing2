import { type WheelEventHandler, useCallback, useEffect } from "react";
import { getBlocksInViewport } from "../model/Page";
import { BrushRect } from "./BrushRect";
import { useController } from "./ControllerProvider";
import { LineView } from "./LineView";
import { SelectionRect } from "./SelectionRect";
import { ShapeView } from "./ShapeView";
import { SnapGuideLayer } from "./SnapGuideLayer";
import { TextView } from "./TextView";
import { useResizeObserver } from "./hooks/useResizeObserver";
import { useStore } from "./hooks/useStore";

export function Canvas() {
    const controller = useController();
    const { page } = useStore(controller.canvasStateStore);
    const viewport = useStore(controller.viewportStore);
    const appState = useStore(controller.appStateStore);

    useEffect(() => {
        function handlePointerMove(ev: PointerEvent) {
            ev.stopPropagation();
            controller.handleCanvasMouseMove(ev.clientX, ev.clientY, ev);
        }

        function handlePointerUp(ev: PointerEvent) {
            ev.stopPropagation();
            controller.handleCanvasMouseUp(ev);
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

    const scale = viewport.scale;
    const resizeObserverRef = useResizeObserver((entry) => {
        controller.viewportStore.setViewportSize(
            entry.contentRect.width,
            entry.contentRect.height,
        );
    });

    return (
        <div
            ref={resizeObserverRef}
            css={{
                position: "fixed",
                inset: 0,
                overflow: "clip",
                pointerEvents: "all",
                background: "#f9fafc",
                ">*": {
                    pointerEvents: "none",
                },
            }}
            onWheel={handleWheel}
            onPointerDown={(ev) => {
                ev.stopPropagation();
                controller.handleCanvasMouseDown(ev.nativeEvent);
            }}
            onDoubleClick={(ev) => {
                ev.stopPropagation();
                controller.handleCanvasDoubleClick(ev.nativeEvent);
            }}
        >
            <div
                css={{
                    position: "relative",
                    transform: `translate(${-viewport.x}px, ${-viewport.y}px) scale(${scale})`,
                    transformOrigin: `${viewport.x}px ${viewport.y}px`,
                }}
            >
                {getBlocksInViewport(page, viewport).map((block) => {
                    switch (block.type) {
                        case "shape": {
                            return (
                                <ShapeView
                                    key={block.id}
                                    shape={block}
                                    isLabelEditing={
                                        appState.mode.type === "edit-text" &&
                                        appState.mode.blockId === block.id
                                    }
                                />
                            );
                        }
                        case "line": {
                            return <LineView key={block.id} line={block} />;
                        }
                        case "text": {
                            return (
                                <TextView
                                    key={block.id}
                                    text={block}
                                    editing={
                                        appState.mode.type === "edit-text" &&
                                        appState.mode.blockId === block.id
                                    }
                                />
                            );
                        }
                        default: {
                            return null;
                        }
                    }
                })}
                <BrushRect />
            </div>

            <SelectionRect />
            <SnapGuideLayer />
        </div>
    );
}
