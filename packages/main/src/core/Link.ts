import {
    PathEntityHandle,
    isPathEntity,
} from "../default/entity/PathEntity/PathEntity";
import type { JSONObject } from "../lib/JSONObject";
import { assert } from "../lib/assert";
import type { EntityHandleMap } from "./Entity";
import type { PageBuilder } from "./PageBuilder";
import { Line } from "./shape/Line";
import { Point } from "./shape/Point";
import { Rect } from "./shape/Shape";
import { translate } from "./shape/TransformMatrix";

export abstract class Link {
    protected constructor(public readonly id: string) {}

    /**
     * Returns the entity IDs that this link depends on.
     * If any of these entities change, the link will be re-evaluated.
     */
    abstract getDependencyIds(): string[];

    /**
     * Applies the link to the builder.
     */
    abstract apply(builder: PageBuilder, entityHandle: EntityHandleMap): void;

    abstract serialize(): SerializedLink;
}

export interface SerializedLink extends JSONObject {
    id: string;
    type: string;
}

export class LinkCollection {
    protected constructor(
        private readonly linkById: Map<string, Link>,
        private readonly linksByDependencyId: Map<string, Set<string>>,
    ) {}

    static create() {
        return new LinkCollection(new Map(), new Map());
    }

    copy(): LinkCollection {
        return new LinkCollection(
            new Map(this.linkById),
            new Map(this.linksByDependencyId),
        );
    }

    add(link: Link): void {
        this.linkById.set(link.id, link);

        for (const dependencyId of link.getDependencyIds()) {
            let linkIds = this.linksByDependencyId.get(dependencyId);
            if (linkIds === undefined) {
                linkIds = new Set<string>();
                this.linksByDependencyId.set(dependencyId, linkIds);
            }
            linkIds.add(link.id);
        }
    }

    getByEntityId(entityId: string): Link[] {
        const linkIds = this.linksByDependencyId.get(entityId);
        if (linkIds === undefined) return [];

        return [...linkIds].map((linkId) => {
            const link = this.linkById.get(linkId);
            assert(link !== undefined, `Link not found: ${linkId}`);
            return link;
        });
    }

    delete(linkId: string) {
        const link = this.linkById.get(linkId);
        assert(link !== undefined, `Link not found: ${linkId}`);

        for (const dependencyId of link.getDependencyIds()) {
            const linkIds = this.linksByDependencyId.get(dependencyId);
            assert(linkIds !== undefined);

            linkIds.delete(linkId);
            if (linkIds.size === 0) {
                this.linksByDependencyId.delete(dependencyId);
            }
        }

        this.linkById.delete(linkId);
    }

    deleteByEntityId(entityId: string) {
        const linkIds = this.linksByDependencyId.get(entityId);
        if (linkIds === undefined) return;

        for (const linkId of linkIds) {
            this.delete(linkId);
        }
    }

    apply(builder: PageBuilder, entityHandle: EntityHandleMap): void {
        let evaluatedDirtyIds = new Set<string>();

        while (evaluatedDirtyIds.size < builder.dirtyEntityIds.size) {
            const newDirtyIds = new Set(builder.dirtyEntityIds);

            const linkIds = new Set<string>();
            for (const entityId of newDirtyIds) {
                if (evaluatedDirtyIds.has(entityId)) continue;

                const ids = this.linksByDependencyId.get(entityId);
                if (ids !== undefined) {
                    for (const id of ids) {
                        linkIds.add(id);
                    }
                }
            }

            for (const linkId of linkIds) {
                const link = this.linkById.get(linkId);
                assert(link !== undefined, `Link not found: ${linkId}`);
                link.apply(builder, entityHandle);
            }

            evaluatedDirtyIds = newDirtyIds;
        }
    }

    serialize(): SerializedLink[] {
        return [...this.linkById.values()].map((link) => link.serialize());
    }

    static deserialize(data: SerializedLink[]): LinkCollection {
        const links = LinkCollection.create();
        for (const linkData of data) {
            switch (linkData.type) {
                case "LinkToRect":
                    links.add(
                        LinkToRect.deserialize(
                            linkData as SerializedLinkToRect,
                        ),
                    );
                    break;
                case "LinkToEdge":
                    links.add(
                        LinkToEdge.deserialize(
                            linkData as SerializedLinkToEdge,
                        ),
                    );
                    break;
                default:
                    throw new Error(`Unknown link type: ${linkData.type}`);
            }
        }
        return links;
    }
}

export class LinkToRect extends Link {
    private lastPoint = new Point(0, 0);
    private rx = 0.5;
    private ry = 0.5;

    constructor(
        id: string,
        public readonly pathId: string,
        public readonly nodeId: string,
        public readonly rectEntityId: string,
    ) {
        super(id);
    }

    getDependencyIds(): string[] {
        return [this.rectEntityId, this.pathId];
    }

    apply(builder: PageBuilder, entityHandle: EntityHandleMap): void {
        const rectEntity = builder.getEntity(this.rectEntityId);
        const rect = entityHandle.getShape(rectEntity).getBoundingRect();

        const pathEntity = builder.getEntity(this.pathId);
        assert(
            isPathEntity(pathEntity),
            `Entity is not a path: ${this.pathId}`,
        );
        const node = PathEntityHandle.getNodeById(pathEntity, this.nodeId);
        if (node === undefined) {
            builder.deleteLink(this.id);
            return;
        }

        if (!this.lastPoint.equals(node)) {
            this.rx = (node.x - rect.left) / rect.width;
            this.ry = (node.y - rect.top) / rect.height;

            if (this.rx < 0 || this.rx > 1 || this.ry < 0 || this.ry > 1) {
                builder.deleteLink(this.id);
                return;
            }
        }

        const x = rect.left + rect.width * this.rx;
        const y = rect.top + rect.height * this.ry;

        builder.setPointPosition(this.pathId, this.nodeId, new Point(x, y));
        this.lastPoint = node;
    }

    serialize(): SerializedLink {
        return {
            type: "LinkToRect",
            id: this.id,
            pathId: this.pathId,
            nodeId: this.nodeId,
            rectEntityId: this.rectEntityId,
            // rx: this.rx,
            // ry: this.ry,
        };
    }

    static deserialize(data: SerializedLinkToRect): LinkToRect {
        return new LinkToRect(
            data.id,
            data.pathId,
            data.nodeId,
            data.rectEntityId,
            // data.rx,
            // data.ry,
        );
    }
}
interface SerializedLinkToRect extends SerializedLink {
    pathId: string;
    nodeId: string;
    rectEntityId: string;
    // rx: number;
    // ry: number;
}

export class LinkToEdge extends Link {
    private static MAX_MARGIN = 30;

    private lastRect = Rect.of(0, 0, 1, 1);

    constructor(
        id: string,
        public readonly entityId: string,
        public readonly pathId: string,
        public p1Id: string,
        public p2Id: string,
        public r = 0.5,
        public distance = 0,
    ) {
        super(id);
    }

    getDependencyIds(): string[] {
        return [this.entityId, this.pathId];
    }

    apply(builder: PageBuilder, entityHandle: EntityHandleMap): void {
        this.updateParameter(builder, entityHandle);

        const entity = builder.getEntity(this.entityId);
        const path = builder.getEntity(this.pathId);
        assert(isPathEntity(path), `Entity is not a path: ${path.type}`);

        const p1 = PathEntityHandle.getNodeById(path, this.p1Id);
        assert(p1 !== undefined, `Node not found: ${this.p1Id} in ${path.id}`);

        const p2 = PathEntityHandle.getNodeById(path, this.p2Id);
        assert(p2 !== undefined, `Node not found: ${this.p2Id} in ${path.id}`);

        const norm = Math.hypot(p2.x - p1.x, p2.y - p1.y);

        // unit vector from p1 to p2
        const vx = (p2.x - p1.x) / norm;
        const vy = (p2.y - p1.y) / norm;

        // projection vector (rotate v by 90 deg)
        const px = -vy;
        const py = vx;

        const rect = entityHandle.getShape(entity).getBoundingRect();

        const x = p1.x + vx * norm * this.r + px * this.distance;
        const y = p1.y + vy * norm * this.r + py * this.distance;

        const newEntity = entityHandle.transform(
            entity,
            translate(x - rect.center.x, y - rect.center.y),
        );

        builder.setEntity(newEntity);
        this.lastRect = entityHandle.getShape(newEntity).getBoundingRect();
    }

    serialize(): SerializedLinkToEdge {
        return {
            type: "LinkToEdge",
            id: this.id,
            entityId: this.entityId,
            pathId: this.pathId,
            p1Id: this.p1Id,
            p2Id: this.p2Id,
            r: this.r,
            distance: this.distance,
        };
    }

    static deserialize(data: SerializedLinkToEdge): LinkToEdge {
        return new LinkToEdge(
            data.id,
            data.entityId,
            data.pathId,
            data.p1Id,
            data.p2Id,
            data.r,
            data.distance,
        );
    }

    private updateParameter(
        builder: PageBuilder,
        entityHandle: EntityHandleMap,
    ): void {
        const entity = builder.getEntity(this.entityId);
        const rect = entityHandle.getShape(entity).getBoundingRect();
        if (this.lastRect.equals(rect)) return;

        const path = builder.getEntity(this.pathId);
        assert(isPathEntity(path), `Entity is not a path: ${this.pathId}`);

        const points = PathEntityHandle.getGraph(path).getOutline().points;
        if (points.length === 0) return;

        const entries = [];
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[i === points.length - 1 ? 0 : i + 1];
            const hitEntry = new Line(
                new Point(p1.x, p1.y),
                new Point(p2.x, p2.y),
            ).getDistance(rect.center);

            entries.push({ hitEntry, p1, p2 });
        }
        const bestEntry = entries.reduce((a, b) =>
            a.hitEntry.distance < b.hitEntry.distance ? a : b,
        );

        const p1 = bestEntry.p1;
        const p2 = bestEntry.p2;
        const linkPoint = bestEntry.hitEntry.point;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const norm = Math.hypot(dx, dy);
        if (Math.abs(dx) > Math.abs(dy)) {
            this.r = (linkPoint.x - p1.x) / dx;
        } else {
            this.r = (linkPoint.y - p1.y) / dy;
        }

        const dx2 = linkPoint.x - rect.center.x;
        const dy2 = linkPoint.y - rect.center.y;

        const maxDistance =
            LinkToEdge.MAX_MARGIN + Math.hypot(rect.width, rect.height) / 2;

        this.p1Id = p1.id;
        this.p2Id = p2.id;
        this.distance = Math.max(
            -maxDistance,
            Math.min((dx2 * dy - dy2 * dx) / norm, maxDistance),
        );
        this.lastRect = rect;
    }
}
interface SerializedLinkToEdge extends SerializedLink {
    entityId: string;
    pathId: string;
    p1Id: string;
    p2Id: string;
    r: number;
    distance: number;
}
