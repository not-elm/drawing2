import type { ReactNode } from "react";
import {
    getSelectedEntities,
    getSelectionRect,
    isSelectEntityMode,
} from "../core/SelectEntityModeController";
import {
    PROPERTY_KEY_CORNER_RADIUS,
    PathEntity,
} from "../default/entity/PathEntity/PathEntity";
import { Line } from "../lib/geo/Line";
import type { Point } from "../lib/geo/Point";
import { Rect } from "../lib/geo/Rect";
import type { TransformMatrix } from "../lib/geo/TransformMatrix";
import { normalizeAngle } from "../lib/normalizeAngle";
import { useStore } from "./hooks/useStore";
import { useApp } from "./useApp";

export function SelectEntityControlLayer() {
    const app = useApp();
    const appState = useStore(app.appStateStore);
    const viewport = useStore(app.viewportStore);
    const canvasState = useStore(app.canvasStateStore);
    if (!isSelectEntityMode(appState.mode)) return null;

    const entities = getSelectedEntities(appState.mode, canvasState);
    const selectionRect = getSelectionRect(appState.mode, canvasState);
    if (selectionRect === null) return null;

    const rect = viewport.transform.apply(selectionRect);

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
                <rect
                    x={0 - 4}
                    y={0 - 4}
                    width={8}
                    height={8}
                    fill="#fff"
                    stroke="var(--color-selection)"
                />
                <rect
                    x={rect.width - 4}
                    y={0 - 4}
                    width={8}
                    height={8}
                    fill="#fff"
                    stroke="var(--color-selection)"
                />
                <rect
                    x={rect.width - 4}
                    y={rect.height - 4}
                    width={8}
                    height={8}
                    fill="#fff"
                    stroke="var(--color-selection)"
                />
                <rect
                    x={0 - 4}
                    y={rect.height - 4}
                    width={8}
                    height={8}
                    fill="#fff"
                    stroke="var(--color-selection)"
                />
                {entities.length === 1 &&
                    entities[0] instanceof PathEntity &&
                    createRadiusHandle(entities[0], rect)}
            </svg>
        </div>
    );
}

const CORNER_RADIUS_HANDLE_MARGIN = 50;

function createRadiusHandle(entity: PathEntity, rect: Rect) {
    const outline = entity.graph.getOutline();
    const nodes: ReactNode[] = [];
    const cornerRadius = entity.getProperty(PROPERTY_KEY_CORNER_RADIUS, 0);

    for (let i = 0; i < outline.length; i++) {
        const p0 = outline[(i - 1 + outline.length) % outline.length];
        const p1 = outline[i];
        const p2 = outline[(i + 1) % outline.length];

        const p10x = p0.x - p1.x;
        const p10y = p0.y - p1.y;
        const norm10 = Math.hypot(p10x, p10y);
        const i10x = p10x / norm10;
        const i10y = p10y / norm10;

        const p12x = p2.x - p1.x;
        const p12y = p2.y - p1.y;
        const norm12 = Math.hypot(p12x, p12y);
        const i12x = p12x / norm12;
        const i12y = p12y / norm12;

        const angleP10 = Math.atan2(p10y, p10x);
        const angleP12 = Math.atan2(p12y, p12x);
        const angle = normalizeAngle(-(angleP12 - angleP10));

        const normVHandle =
            cornerRadius / Math.sin(angle / 2) + CORNER_RADIUS_HANDLE_MARGIN;
        const vHandleX = p1.x + ((i10x + i12x) / 2) * normVHandle;
        const vHandleY = p1.y + ((i10y + i12y) / 2) * normVHandle;

        nodes.push(
            <circle
                key={p1.id}
                cx={vHandleX - rect.left}
                cy={vHandleY - rect.top}
                r={5}
                fill="#fff"
                stroke="var(--color-selection)"
            />,
        );
    }

    return nodes;
}

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
