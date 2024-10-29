import { LinkToEdge } from "../core/Link";
import { SelectEntityModeController } from "../core/SelectEntityModeController";
import { Point } from "../core/shape/Point";
import {
    PathEntityHandle,
    isPathEntity,
} from "../default/entity/PathEntity/PathEntity";
import { assert } from "../lib/assert";
import { useCell } from "./hooks/useCell";
import { useApp } from "./useApp";

export function LinkGuideLayer() {
    const app = useApp();
    const page = useCell(app.canvas.page);
    const selectedEntityIds = useCell(app.canvas.selectedEntityIds);
    const mode = useCell(app.mode);
    if (mode !== SelectEntityModeController.type) return null;

    if (selectedEntityIds.size >= 2) return null;

    const selectedEntityId = selectedEntityIds.values().next().value;
    if (selectedEntityId === undefined) return null;

    const links = page.links.getByEntityId(selectedEntityId);

    return links.map((link) => {
        if (link instanceof LinkToEdge) {
            return <LinkToEdgeGuide key={link.id} link={link} />;
        }

        return null;
    });
}

export function LinkToEdgeGuide({ link }: { link: LinkToEdge }) {
    const app = useApp();
    const viewport = useCell(app.viewport);
    const page = useCell(app.canvas.page);

    const entity = page.entities.get(link.entityId);
    assert(entity !== undefined, `Entity ${link.entityId} not found`);
    const rect = app.entityHandle.getShape(entity).getBoundingRect();

    const path = page.entities.get(link.pathId);
    assert(path !== undefined, `Path ${link.pathId} not found`);
    assert(isPathEntity(path), `Entity ${link.pathId} is not a path`);

    const p1 = PathEntityHandle.getNodeById(path, link.p1Id);
    assert(p1 !== undefined, `Node ${link.p1Id} not found`);

    const p2 = PathEntityHandle.getNodeById(path, link.p2Id);
    assert(p2 !== undefined, `Node ${link.p2Id} not found`);

    const linkPointX = p1.x * (1 - link.r) + p2.x * link.r;
    const linkPointY = p1.y * (1 - link.r) + p2.y * link.r;

    const left = linkPointX;
    const top = linkPointY;

    const svgOrigin = viewport.transform.apply(new Point(left, top));

    return (
        <svg
            viewBox="0 0 1 1"
            css={{
                position: "absolute",
                left: svgOrigin.x,
                top: svgOrigin.y,
                width: 1,
                height: 1,
                overflow: "visible",
            }}
        >
            <line
                css={{
                    stroke: "var(--color-selection)",
                    strokeWidth: 2,
                    strokeDasharray: "2 2",
                }}
                x1={(linkPointX - left) * viewport.scale}
                y1={(linkPointY - top) * viewport.scale}
                x2={(rect.center.x - left) * viewport.scale}
                y2={(rect.center.y - top) * viewport.scale}
            />
            <circle
                css={{
                    stroke: "var(--color-selection)",
                    strokeWidth: 2,
                    fill: "#fff",
                }}
                cx={(linkPointX - left) * viewport.scale}
                cy={(linkPointY - top) * viewport.scale}
                r={4}
            />
        </svg>
    );
}
