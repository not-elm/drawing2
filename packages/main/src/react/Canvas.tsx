import { type WheelEventHandler, useCallback, useEffect } from "react";
import { useController } from "./ControllerProvider";
import { LineToolPreview } from "./LineToolPreview";
import { LineView } from "./LineView";
import { SelectionRect } from "./SelectionRect";
import { SelectorRect } from "./SelectorRect";
import { ShapeToolPreview } from "./ShapeToolPreview";
import { ShapeView } from "./ShapeView";
import { TextView } from "./TextView";
import { useStore } from "./hooks/useStore";

export function Canvas() {
    const controller = useController();
    const { page } = useStore(controller.canvasStateStore);
    const viewport = useStore(controller.viewportStore);
    const sessions = useStore(controller.gestureRecognizer);
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

    return (
        <div
            css={{
                position: "fixed",
                inset: 0,
                overflow: "clip",
                pointerEvents: "all",
                ">*": {
                    pointerEvents: "none",
                },
            }}
            onWheel={handleWheel}
            onPointerDown={(ev) => {
                ev.stopPropagation();
                controller.handleCanvasMouseDown(ev.nativeEvent);
            }}
        >
            <div
                css={{
                    position: "relative",
                    transform: `translate(${-viewport.x}px, ${-viewport.y}px) scale(${scale})`,
                    transformOrigin: `${viewport.x}px ${viewport.y}px`,
                }}
            >
                {page.blockIds.map((blockId) => {
                    const block = page.blocks[blockId];
                    if (block === undefined) return null;

                    switch (block.type) {
                        case "shape": {
                            return (
                                <ShapeView
                                    key={block.id}
                                    shape={block}
                                    isLabelEditing={
                                        appState.mode.type === "text" &&
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
                                        appState.mode.type === "text" &&
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
                {Object.values(sessions).map(
                    ({ pointerId, handlers, data }) => {
                        switch (handlers.type) {
                            case "selector":
                                return (
                                    <SelectorRect key={pointerId} data={data} />
                                );
                            case "new-shape":
                                return (
                                    <ShapeToolPreview
                                        key={pointerId}
                                        data={data}
                                    />
                                );
                            case "new-line":
                                return (
                                    <LineToolPreview
                                        key={pointerId}
                                        data={data}
                                    />
                                );
                            default:
                                return null;
                        }
                    },
                )}
            </div>

            <SelectionRect />
            <PointHighlightLayer />
        </div>
    );
}

function PointHighlightLayer() {
    const controller = useController();
    const viewport = useStore(controller.viewportStore);
    const { hitEntry } = useStore(controller.hoverStateStore);

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
                css={{
                    overflow: "visible",
                    position: "absolute",
                    top: 0,
                    left: 0,
                }}
            >
                {hitEntry !== null && (
                    <circle
                        r={8}
                        cx={(hitEntry.point.x - viewport.x) * viewport.scale}
                        cy={(hitEntry.point.y - viewport.y) * viewport.scale}
                        css={{ fill: "var(--color-selection)", opacity: 0.3 }}
                    />
                )}
            </svg>
        </div>
    );
}
