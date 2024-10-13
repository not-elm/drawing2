import { type WheelEventHandler, useCallback, useEffect } from "react";
import { getEntitiesInViewport } from "../core/model/Page";
import { entityViewHandleMap } from "../instance";
import { BrushRect } from "./BrushRect";
import { useController } from "./ControllerProvider";
import { SelectionRect } from "./SelectionRect";
import { SnapGuideLayer } from "./SnapGuideLayer";
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
            controller.handleMouseMove(ev);
        }

        function handlePointerUp(ev: PointerEvent) {
            ev.stopPropagation();
            controller.handleMouseUp(ev);
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
                cursor: appState.cursor,
                ">*": {
                    pointerEvents: "none",
                },
            }}
            onWheel={handleWheel}
            onPointerDown={(ev) => {
                ev.stopPropagation();
                controller.handleMouseDown(ev.nativeEvent);
            }}
            onDoubleClick={(ev) => {
                ev.stopPropagation();
                controller.handleDoubleClick(ev.nativeEvent);
            }}
        >
            <div
                css={{
                    position: "relative",
                    transform: `translate(${-viewport.rect.left}px, ${-viewport
                        .rect.top}px) scale(${scale})`,
                    transformOrigin: `${viewport.rect.left}px ${viewport.rect.top}px`,
                }}
            >
                {getEntitiesInViewport(page, viewport).map((entity) => {
                    const View = entityViewHandleMap().getViewComponent(entity);
                    return <View entity={entity} key={entity.id} />;
                })}
                <BrushRect />
            </div>

            <SelectionRect />
            <SnapGuideLayer />
        </div>
    );
}
