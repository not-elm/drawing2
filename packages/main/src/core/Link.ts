import { PathEntity } from "../default/entity/PathEntity/PathEntity";
import { assert } from "../lib/assert";
import { Line } from "../lib/geo/Line";
import { Point } from "../lib/geo/Point";
import { Rect } from "../lib/geo/Rect";
import { translate } from "../lib/geo/TransformMatrix";
import type { JSONObject } from "./JSONObject";
import type { PageDraft } from "./PageDraft";

export abstract class Link {
    protected constructor(public readonly id: string) {}

    /**
     * Returns the entity IDs that this link depends on.
     * If any of these entities change, the link will be re-evaluated.
     */
    abstract getDependencyIds(): string[];

    /**
     * Applies the link to the draft.
     */
    abstract apply(draft: PageDraft): void;

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

    apply(draft: PageDraft): void {
        let evaluatedDirtyIds = new Set<string>();

        while (evaluatedDirtyIds.size < draft.dirtyEntityIds.size) {
            const newDirtyIds = new Set(draft.dirtyEntityIds);

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
                link.apply(draft);
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

    apply(draft: PageDraft): void {
        const rectEntity = draft.getEntity(this.rectEntityId);
        const rect = rectEntity.getBoundingRect();

        const pathEntity = draft.getEntity(this.pathId);
        const node = pathEntity.getNodeById(this.nodeId);
        if (node === undefined) {
            draft.deleteLink(this.id);
            return;
        }

        if (!this.lastPoint.equals(node.point)) {
            this.rx = (node.point.x - rect.left) / rect.width;
            this.ry = (node.point.y - rect.top) / rect.height;

            if (this.rx < 0 || this.rx > 1 || this.ry < 0 || this.ry > 1) {
                draft.deleteLink(this.id);
                return;
            }
        }

        const x = rect.left + rect.width * this.rx;
        const y = rect.top + rect.height * this.ry;

        draft.setPointPosition(this.pathId, this.nodeId, new Point(x, y));
        this.lastPoint = node.point;
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

export class LinkToEdge extends Link {
    private lastRect = Rect.of(0, 0, 1, 1);
    private r = 0.5;

    constructor(
        id: string,
        public readonly entityId: string,
        public readonly pathId: string,
        public readonly p1Id: string,
        public readonly p2Id: string,
    ) {
        super(id);
    }

    getDependencyIds(): string[] {
        return [this.entityId, this.pathId];
    }

    apply(draft: PageDraft): void {
        const entity = draft.getEntity(this.entityId);
        const path = draft.getEntity(this.pathId);
        assert(
            path instanceof PathEntity,
            `Entity is not a path: ${this.pathId}`,
        );

        const p1 = path.getNodeById(this.p1Id);
        assert(
            p1 !== undefined,
            `Node not found: ${this.p1Id} in ${path.props.id}`,
        );

        const p2 = path.getNodeById(this.p2Id);
        assert(
            p2 !== undefined,
            `Node not found: ${this.p2Id} in ${path.props.id}`,
        );

        if (!this.lastRect.equals(entity.getBoundingRect())) {
            // recompute r
            const { point: linkPoint } = new Line({
                p1: p1.point,
                p2: p2.point,
            }).getDistance(entity.getBoundingRect().center);
            const dx = p2.point.x - p1.point.x;
            const dy = p2.point.y - p1.point.y;

            if (Math.abs(dx) > Math.abs(dy)) {
                this.r = (linkPoint.x - p1.point.x) / dx;
            } else {
                this.r = (linkPoint.y - p1.point.y) / dy;
            }
        }

        const norm = Math.hypot(
            p2.point.x - p1.point.x,
            p2.point.y - p1.point.y,
        );

        // unit vector from p1 to p2
        const vx = (p2.point.x - p1.point.x) / norm;
        const vy = (p2.point.y - p1.point.y) / norm;

        // projection vector (rotate v by 90 deg)
        const px = -vy;
        const py = vx;

        const rect = entity.getBoundingRect();
        const distance =
            Math.abs((rect.width / 2) * px) + Math.abs((rect.height / 2) * py);

        const x = p1.point.x + vx * norm * this.r + px * distance;
        const y = p1.point.y + vy * norm * this.r + py * distance;

        const newEntity = entity.transform(
            translate(x - rect.center.x, y - rect.center.y),
        );

        draft.setEntity(newEntity);
        this.lastRect = newEntity.getBoundingRect();
    }

    serialize(): SerializedLinkToEdge {
        return {
            type: "LinkToEdge",
            id: this.id,
            entityId: this.entityId,
            pathId: this.pathId,
            p1Id: this.p1Id,
            p2Id: this.p2Id,
        };
    }

    static deserialize(data: SerializedLinkToEdge): LinkToEdge {
        return new LinkToEdge(
            data.id,
            data.entityId,
            data.pathId,
            data.p1Id,
            data.p2Id,
        );
    }
}

interface SerializedLinkToEdge extends SerializedLink {
    entityId: string;
    pathId: string;
    p1Id: string;
    p2Id: string;
}

interface SerializedLinkToRect extends SerializedLink {
    pathId: string;
    nodeId: string;
    rectEntityId: string;
    // rx: number;
    // ry: number;
}
