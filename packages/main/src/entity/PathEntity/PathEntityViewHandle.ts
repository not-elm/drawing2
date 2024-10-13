import type { ComponentType } from "react";
import type { Viewport } from "../../core/model/Viewport";
import { Transform } from "../../lib/geo/Transform";
import { EntityViewHandle } from "../../react/EntityViewMap/EntityViewHandle";
import type { PathEntity } from "./PathEntity";
import { PathView } from "./PathView";

export class PathEntityViewHandle extends EntityViewHandle<PathEntity> {
    getType(): string {
        return "path";
    }

    getViewComponent(): ComponentType<{ entity: PathEntity }> {
        return PathView;
    }

    getOutline(entity: PathEntity, viewport: Viewport): string {
        const transform = Transform.translate(
            -viewport.rect.left,
            -viewport.rect.top,
        ).scale(viewport.rect.topLeft, 0, 0);

        const nodes = Object.values(entity.nodes);
        const left = Math.min(...nodes.map((node) => node.point.x));
        const top = Math.min(...nodes.map((node) => node.point.y));

        let lastNodeId = "(nothing)";
        const commands: string[] = [];
        for (const [startNodeId, endNodeId] of entity.edges) {
            const startNode = entity.nodes[startNodeId];
            if (startNodeId !== lastNodeId) {
                const startCanvasPoint = transform.apply(startNode.point);
                commands.push(`M${startCanvasPoint.x} ${startCanvasPoint.y}`);
            }

            const endNode = entity.nodes[endNodeId];
            const endCanvasPoint = transform.apply(endNode.point);
            commands.push(`L${endCanvasPoint.x} ${endCanvasPoint.y}`);

            lastNodeId = endNodeId;
        }

        return commands.join(" ");
    }
}
