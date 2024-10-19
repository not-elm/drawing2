import styled from "@emotion/styled";
import { Line } from "../lib/geo/Line";
import type { Point } from "../lib/geo/Point";
import { Rect } from "../lib/geo/Rect";
import type { TransformMatrix } from "../lib/geo/TransformMatrix";
import { useStore } from "./hooks/useStore";
import { useApp } from "./useApp";

export function SelectionRect() {
    const app = useApp();
    const appState = useStore(app.appStateStore);
    const viewport = useStore(app.viewportStore);
    const canvasState = useStore(app.canvasStateStore);

    const selectionRect = canvasState.getSelectionRect();
    if (selectionRect === null) return null;

    const entities = canvasState.getSelectedEntities();
    const rect = viewport.transform.apply(selectionRect);

    if (appState.mode.type !== "select") return null;

    return (
        <div
            css={{
                position: "absolute",
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
            }}
        >
            <svg
                viewBox="0 0 1 1"
                width={1}
                height={1}
                css={{
                    position: "absolute",
                    inset: 0,
                    overflow: "visible",
                }}
            >
                <rect
                    css={{
                        stroke: "var(--color-selection)",
                        fill: "none",
                    }}
                    x={0}
                    y={0}
                    width={rect.width}
                    height={rect.height}
                    strokeWidth={3}
                />
                {entities.map((entity) => {
                    const d = convertGeometryToPathDefinition(
                        entity.getOutline(),
                        selectionRect.topLeft,
                        viewport.transform,
                    );
                    return (
                        <path
                            key={entity.props.id}
                            css={{
                                stroke: "var(--color-selection)",
                                fill: "none",
                            }}
                            d={d}
                            strokeWidth={1}
                        />
                    );
                })}
            </svg>
            <ResizeHandle
                css={{
                    top: "0%",
                    left: "0%",
                    width: "100%",
                    cursor: "ns-resize",
                }}
            />
            <ResizeHandle
                css={{
                    top: "0%",
                    left: "100%",
                    height: "100%",
                    cursor: "ew-resize",
                }}
            />
            <ResizeHandle
                css={{
                    top: "100%",
                    left: "0%",
                    width: "100%",
                    cursor: "ns-resize",
                }}
            />
            <ResizeHandle
                css={{
                    top: "0%",
                    left: "0%",
                    height: "100%",
                    cursor: "ew-resize",
                }}
            />

            <ResizeHandle
                css={{
                    top: "0%",
                    left: "0%",
                    cursor: "nwse-resize",
                }}
            >
                <CornerResizeHandle />
            </ResizeHandle>
            <ResizeHandle
                css={{
                    top: "0%",
                    left: "100%",
                    cursor: "nesw-resize",
                }}
            >
                <CornerResizeHandle />
            </ResizeHandle>
            <ResizeHandle
                css={{
                    top: "100%",
                    left: "100%",
                    cursor: "nwse-resize",
                }}
            >
                <CornerResizeHandle />
            </ResizeHandle>
            <ResizeHandle
                css={{
                    top: "100%",
                    left: "0%",
                    cursor: "nesw-resize",
                }}
            >
                <CornerResizeHandle />
            </ResizeHandle>
        </div>
    );
}

const ResizeHandle = styled.div({
    position: "absolute",
    transform: "translate(-8px, -8px)",
    minWidth: "16px",
    minHeight: "16px",
});
const CornerResizeHandle = styled.div({
    background: "#fff",
    outline: "2px solid var(--color-selection)",
    boxSizing: "border-box",
    position: "absolute",
    transform: "translate(-50%, -50%)",
    top: "50%",
    left: "50%",
    minWidth: "8px",
    minHeight: "8px",
});

export function convertGeometryToPathDefinition(
    geos: (Rect | Line | Point)[],
    svgOrigin: Point,
    viewportTransform: TransformMatrix,
): string {
    const origin = viewportTransform.apply(svgOrigin);

    const ds: string[] = [];
    for (const g of geos) {
        if (g instanceof Rect) {
            const rect = viewportTransform.apply(g);
            ds.push(
                `M${rect.left - origin.x},${rect.top - origin.y} h${
                    rect.width
                } v${rect.height} h${-rect.width} v${-rect.height}`,
            );
        }
        if (g instanceof Line) {
            const p1 = viewportTransform.apply(g.p1);
            const p2 = viewportTransform.apply(g.p2);

            ds.push(
                `M${p1.x - origin.x},${p1.y - origin.y} L${p2.x - origin.x},${
                    p2.y - origin.y
                }`,
            );
        }
    }

    return ds.join("");
}
