import { type WheelEventHandler, useCallback, useEffect } from "react";
import { LinkGuideLayer } from "./LinkGuideLayer";
import { SelectEntityControlLayer } from "./SelectEntityControlLayer";
import { SelectPathControlLayer } from "./SelectPathControlLayer";
import { SnapGuideLayer } from "./SnapGuideLayer";
import { useResizeObserver } from "./hooks/useResizeObserver";
import { useStore } from "./hooks/useStore";
import { useApp } from "./useApp";

export function Canvas() {
    const app = useApp();
    const page = useStore(app.canvasStateStore);
    const viewport = useStore(app.viewportStore);
    const appState = useStore(app.appStateStore);

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
        app.viewportStore.setViewportSize(
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
                app.handlePointerDown(ev.nativeEvent);
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
                {page.getEntitiesInRect(viewport.rect).map((entity) => {
                    const View = app.getEntityView(entity);
                    return <View entity={entity} key={entity.props.id} />;
                })}
            </div>

            <SelectEntityControlLayer />
            <SelectPathControlLayer />
            <LinkGuideLayer />
            <SnapGuideLayer />
        </div>
    );
}
