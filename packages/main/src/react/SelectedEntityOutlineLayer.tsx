import { SelectByBrushModeController } from "../core/mode/SelectByBrushModeController";
import { SelectEntityModeController } from "../core/mode/SelectEntityModeController";
import { SelectPathModeController } from "../core/mode/SelectPathModeController";
import { Graph } from "../core/shape/Graph";
import { Line } from "../core/shape/Line";
import { Rect, type Shape } from "../core/shape/Shape";
import type { TransformMatrix } from "../core/shape/TransformMatrix";
import { Variables } from "./Variables";
import { useApp } from "./hooks/useApp";
import { useCell } from "./hooks/useCell";

export function SelectedEntityOutlineLayer() {
    const app = useApp();
    const mode = useCell(app.mode);
    const viewport = useCell(app.viewport);
    const entities = useCell(app.canvas.selectedEntities);

    if (
        !(
            mode === SelectEntityModeController.type ||
            mode === SelectByBrushModeController.type ||
            mode === SelectPathModeController.type
        )
    ) {
        return null;
    }

    return (
        <svg
            viewBox="0 0 1 1"
            width={1}
            height={1}
            css={{
                position: "absolute",
                overflow: "visible",
                left: 0,
                top: 0,
            }}
        >
            {entities.map((entity) => (
                <path
                    key={entity.id}
                    css={{
                        stroke: Variables.color.outline,
                        fill: "none",
                    }}
                    d={convertShapeToPathDefinition(
                        app.entityHandle.getShape(entity),
                        viewport.transform,
                    )}
                    strokeWidth={1}
                />
            ))}
        </svg>
    );
}

export function convertShapeToPathDefinition(
    shape: Shape,
    viewportTransform: TransformMatrix,
): string {
    const ds: string[] = [];
    if (shape instanceof Rect) {
        const rect = viewportTransform.apply(shape);
        ds.push(
            `M${rect.left},${rect.top} h${rect.width} v${
                rect.height
            } h${-rect.width} v${-rect.height}`,
        );
    }
    if (shape instanceof Graph) {
        for (const edge of shape.getOutline().getEdges()) {
            const p1 = viewportTransform.apply(edge.p1);
            const p2 = viewportTransform.apply(edge.p2);

            ds.push(`M${p1.x},${p1.y} L${p2.x},${p2.y}`);
        }
    }
    if (shape instanceof Line) {
        const p1 = viewportTransform.apply(shape.p1);
        const p2 = viewportTransform.apply(shape.p2);

        ds.push(`M${p1.x},${p1.y} L${p2.x},${p2.y}`);
    }

    return ds.join("");
}
