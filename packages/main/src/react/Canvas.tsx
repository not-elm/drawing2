import { type WheelEventHandler, useCallback, useEffect } from "react";
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
            app.handlePointerMove(ev);
        }

        function handlePointerUp(ev: PointerEvent) {
            ev.stopPropagation();
            app.handlePointerUp(ev);
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
                    ev.clientX,
                    ev.clientY,
                );
            } else {
                app.handleScroll(ev.deltaX, ev.deltaY);
            }
        },
        [app, viewport.scale],
    );

    const resizeObserverRef = useResizeObserver((entry) => {
        app.resizeViewport(entry.contentRect.width, entry.contentRect.height);
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
                cursor,
                ">*": {
                    pointerEvents: "none",
                },
            }}
            onWheel={handleWheel}
            onPointerDown={(ev) => {
                ev.stopPropagation();
                app.handlePointerDown(ev.nativeEvent);
            }}
            onContextMenu={(ev) => {
                ev.stopPropagation();
                app.handleContextMenu(ev.nativeEvent);
            }}
            onDoubleClick={(ev) => {
                ev.stopPropagation();
                app.handleDoubleClick(ev.nativeEvent);
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
