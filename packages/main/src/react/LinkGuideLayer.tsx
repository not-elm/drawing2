import { LinkToEdge } from "../core/Link";
import { SelectEntityModeController } from "../core/SelectEntityModeController";
import { Point } from "../core/shape/Point";
import { assert } from "../lib/assert";
import { useStore } from "./hooks/useStore";
import { useApp } from "./useApp";

export function LinkGuideLayer() {
    const app = useApp();
    const canvasState = useStore(app.canvasStateStore);
    const mode = useStore(app.appStateStore).mode;
    if (mode !== SelectEntityModeController.MODE_NAME) return null;

    if (canvasState.selectedEntityIds.size >= 2) return null;

    const selectedEntityId = canvasState.selectedEntityIds
        .values()
        .next().value;
    if (selectedEntityId === undefined) return null;

    const links = canvasState.page.links.getByEntityId(selectedEntityId);

    return links.map((link) => {
        if (link instanceof LinkToEdge) {
            return <LinkToEdgeGuide key={link.id} link={link} />;
        }

        return null;
    });
}

export function LinkToEdgeGuide({ link }: { link: LinkToEdge }) {
    const app = useApp();
    const viewport = useStore(app.viewportStore);
    const canvasState = useStore(app.canvasStateStore);

    const entity = canvasState.page.entities.get(link.entityId);
    assert(entity !== undefined, `Entity ${link.entityId} not found`);
    const rect = entity.getBoundingRect();

    const path = canvasState.page.entities.get(link.pathId);
    assert(path !== undefined, `Path ${link.pathId} not found`);

    const p1 = path.getNodeById(link.p1Id);
    assert(p1 !== undefined, `Node ${link.p1Id} not found`);

    const p2 = path.getNodeById(link.p2Id);
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
