import { type WheelEventHandler, useCallback, useEffect, useRef } from "react";
import type { NativeMouseEvent, NativePointerEvent } from "../core/App";
import { Point } from "../core/shape/Point";
import { LinkGuideLayer } from "./LinkGuideLayer";
import { NewPathControlLayer } from "./NewPathControlLayer";
import { SelectByBrushControlLayer } from "./SelectByBrushControlLayer";
import { SelectEntityControlLayer } from "./SelectEntityControlLayer";
import { SelectPathControlLayer } from "./SelectPathControlLayer";
import { SelectedEntityOutlineLayer } from "./SelectedEntityOutlineLayer";
import { SelectionRectLayer } from "./SelectionRectLayer";
import { SnapGuideLayer } from "./SnapGuideLayer";
import { useApp } from "./hooks/useApp";
import { useCell } from "./hooks/useCell";
import { useResizeObserver } from "./hooks/useResizeObserver";

export function Canvas() {
    const app = useApp();
    const page = useCell(app.canvas.page);
    const viewport = useCell(app.viewport);
    const cursor = useCell(app.cursor);

    useEffect(() => {
        function handlePointerMove(ev: PointerEvent) {
            ev.stopPropagation();
            app.handlePointerMove(toNativePointerEvent(ev, canvasRef.current));
        }

        function handlePointerUp(ev: PointerEvent) {
            ev.stopPropagation();
            app.handlePointerUp(toNativePointerEvent(ev, canvasRef.current));
        }

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);

        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, [app]);

    const handleWheel: WheelEventHandler = useCallback(
        (ev) => {
            if (ev.ctrlKey) {
                app.handleScale(
                    Math.min(
                        Math.max(0.1, viewport.scale - ev.deltaY * 0.0005),
                        4,
                    ),
                    ev.nativeEvent.offsetX,
                    ev.nativeEvent.offsetY,
                );
            } else {
                app.handleScroll(ev.deltaX, ev.deltaY);
            }
        },
        [app, viewport.scale],
    );

    const canvasRef = useRef<HTMLDivElement | null>(null);
    const resizeObserverRef = useResizeObserver((entry) => {
        app.resizeViewport(entry.contentRect.width, entry.contentRect.height);
    });

    return (
        <div
            ref={(e) => {
                resizeObserverRef(e);
                canvasRef.current = e;
            }}
            css={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "clip",
                pointerEvents: "all",
                background: "#f9fafc",
                cursor,
                ">*": {
                    pointerEvents: "none",
                },
            }}
            onWheel={handleWheel}
            onPointerDown={(ev) => {
                ev.stopPropagation();
                ev.currentTarget.setPointerCapture(ev.pointerId);
                app.handlePointerDown(
                    toNativePointerEvent(ev.nativeEvent, canvasRef.current),
                );
            }}
            onContextMenu={(ev) => {
                ev.stopPropagation();
                app.handleContextMenu(
                    toNativeMouseEvent(ev.nativeEvent, canvasRef.current),
                );
            }}
            onDoubleClick={(ev) => {
                ev.stopPropagation();
                app.handleDoubleClick(
                    toNativeMouseEvent(ev.nativeEvent, canvasRef.current),
                );
            }}
        >
            <div
                css={{
                    position: "relative",
                    transform: `translate(${-viewport.rect.left}px, ${-viewport
                        .rect.top}px) scale(${viewport.scale})`,
                    transformOrigin: `${viewport.rect.left}px ${viewport.rect.top}px`,
                }}
            >
                {page
                    .getEntitiesInRect(viewport.rect, app.entityHandle)
                    .map((entity) => {
                        const View = app.getEntityView(entity);
                        return <View entity={entity} key={entity.id} />;
                    })}
            </div>

            <SelectedEntityOutlineLayer />
            <SelectionRectLayer />
            <SelectEntityControlLayer />
            <SelectPathControlLayer />
            <SelectByBrushControlLayer />
            <NewPathControlLayer />
            <LinkGuideLayer />
            <SnapGuideLayer />
        </div>
    );
}

/**
 * Convert DOM MouseEvent to NativeMouseEvent including coordinate conversion
 */
function toNativeMouseEvent(
    ev: MouseEvent,
    canvasDOM: HTMLElement | null,
): NativeMouseEvent {
    const canvasRect = canvasDOM?.getBoundingClientRect();

    return {
        preventDefault: () => ev.preventDefault(),
        button: ev.button,
        canvasPoint: new Point(
            ev.clientX - (canvasRect?.left ?? 0),
            ev.clientY - (canvasRect?.top ?? 0),
        ),
        shiftKey: ev.shiftKey,
        metaKey: ev.metaKey,
        ctrlKey: ev.ctrlKey,
    };
}

function toNativePointerEvent(
    ev: PointerEvent,
    canvasDOM: HTMLElement | null,
): NativePointerEvent {
    return {
        ...toNativeMouseEvent(ev, canvasDOM),
        pointerId: ev.pointerId,
    };
}
