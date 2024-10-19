import { assert } from "../lib/assert";
import type { Point } from "../lib/geo/Point";
import type { TransformMatrix } from "../lib/geo/TransformMatrix";
import type { Entity } from "./Entity";
import type { Link, LinkCollection } from "./Link";
import { Page } from "./Page";

/**
 * Mutable version of {@link Page}.
 * This class also records all changes applied to the original.
 */
class PageDraftCore {
    private readonly entities: Map<string, Entity>;
    public readonly entityIds: string[];
    public readonly dirtyEntityIds = new Set<string>();
    public readonly updatedEntityIds = new Set<string>();
    public readonly deletedEntityIds = new Set<string>();
    public readonly links: LinkCollection;

    constructor(page: Page) {
        this.entities = new Map(page.entities);
        this.entityIds = [...page.entityIds];
        this.links = page.links.copy();
    }

    toPage(): Page {
        return new Page({
            entities: this.entities,
            entityIds: this.entityIds,
            links: this.links,
        });
    }

    getEntity(entityId: string): Entity {
        const entity = this.entities.get(entityId);
        assert(entity !== undefined, `Entity not found: ${entityId}`);
        return entity;
    }

    setEntity(entity: Entity): void {
        if (!this.entities.has(entity.props.id)) {
            this.entityIds.push(entity.props.id);
        }
        this.entities.set(entity.props.id, entity);

        this.dirtyEntityIds.add(entity.props.id);
        this.updatedEntityIds.add(entity.props.id);
        this.deletedEntityIds.delete(entity.props.id);
    }

    deleteEntity(entityId: string): void {
        this.entities.delete(entityId);
        const index = this.entityIds.indexOf(entityId);
        this.entityIds.splice(index, 1);
        this.links.deleteByEntityId(entityId);

        this.dirtyEntityIds.add(entityId);
        this.updatedEntityIds.delete(entityId);
        this.deletedEntityIds.add(entityId);
    }

    addLink(link: Link): void {
        this.links.add(link);
    }

    deleteLink(linkId: string): void {
        this.links.delete(linkId);
    }
}

/**
 * PageDraft with some utility methods.
 */
export class PageDraft extends PageDraftCore {
    setEntities(entities: Entity[]): void {
        for (const entity of entities) {
            this.setEntity(entity);
        }
    }

    deleteEntities(entityIds: Set<string>): void {
        for (const entityId of entityIds) {
            this.deleteEntity(entityId);
        }
    }

    transformEntities(entityIds: string[], transform: TransformMatrix) {
        for (const entityId of entityIds) {
            const entity = this.getEntity(entityId);
            this.setEntity(entity.transform(transform));
        }
    }

    setPointPosition(pathId: string, nodeId: string, point: Point) {
        const entity = this.getEntity(pathId);
        this.setEntity(entity.setNodePosition(nodeId, point));
    }

    updateProperty(entityIds: string[], key: string, value: unknown) {
        for (const entityId of entityIds) {
            const entity = this.getEntity(entityId);
            this.setEntity(entity.setProperty(key, value));
        }
    }

    bringToFront(entityIds: Set<string>) {
        return this.bringForwardOf(entityIds, this.entityIds.length - 1);
    }

    bringForward(entityIds: Set<string>) {
        let mostBackwardResult = null;
        for (const entityId of entityIds) {
            const result = this.findForwardOverlappedEntity(
                entityId,
                entityIds,
            );
            if (result === null) continue;
            if (mostBackwardResult === null) {
                mostBackwardResult = result;
            } else {
                if (result.globalIndex < mostBackwardResult.globalIndex) {
                    mostBackwardResult = result;
                }
            }
        }
        if (mostBackwardResult === null) {
            // selected entities are already at the front
            return this;
        }

        this.bringForwardOf(entityIds, mostBackwardResult.globalIndex);
    }

    sendBackward(entityIds: Set<string>) {
        let mostForwardResult = null;
        for (const entityId of entityIds) {
            const result = this.findBackwardOverlappedEntity(
                entityId,
                entityIds,
            );
            if (result === null) continue;
            if (mostForwardResult === null) {
                mostForwardResult = result;
            } else {
                if (result.globalIndex > mostForwardResult.globalIndex) {
                    mostForwardResult = result;
                }
            }
        }
        if (mostForwardResult === null) {
            // selected entities are already at the front
            return this;
        }

        this.sendBackwardOf(entityIds, mostForwardResult.globalIndex);
    }

    sendToBack(entityIds: Set<string>) {
        this.sendBackwardOf(entityIds, 0);
    }

    addLinks(links: Link[]): void {
        for (const link of links) {
            this.addLink(link);
        }
    }

    deleteLinks(linkIds: string[]): void {
        for (const linkId of linkIds) {
            this.deleteLink(linkId);
        }
    }

    /**
     * Update the z-index of the target entities to bring them
     * forward of the target z-index
     */
    private bringForwardOf(
        targetEntityIdSet: Set<string>,
        targetZIndex: number,
    ) {
        // Current z-index of selected entities
        const currentIndices = [];
        for (let i = 0; i < this.entityIds.length; i++) {
            if (targetEntityIdSet.has(this.entityIds[i])) {
                currentIndices.push(i);
            }
        }

        for (const currentIndex of currentIndices.toReversed()) {
            if (currentIndex >= targetZIndex) continue;

            const [id] = this.entityIds.splice(currentIndex, 1);
            this.entityIds.splice(targetZIndex, 0, id);
            targetZIndex -= 1;
        }
    }

    /**
     * Update the z-index of the target entities to send them
     * backward of the target z-index
     */
    private sendBackwardOf(
        targetEntityIdSet: Set<string>,
        targetZIndex: number,
    ) {
        // Current z-index of selected entities
        const currentIndices = [];
        for (let i = 0; i < this.entityIds.length; i++) {
            if (targetEntityIdSet.has(this.entityIds[i])) {
                currentIndices.push(i);
            }
        }

        for (const currentIndex of currentIndices) {
            if (currentIndex <= targetZIndex) continue;

            const [id] = this.entityIds.splice(currentIndex, 1);
            this.entityIds.splice(targetZIndex, 0, id);
            targetZIndex += 1;
        }
    }

    /**
     * Find the overlapped entity with the given entity from the entities
     * located in front of it, and return the most-backward entity.
     */
    private findForwardOverlappedEntity(
        entityId: string,
        ignoreEntityIds: Set<string>,
    ): { entityId: string; globalIndex: number } | null {
        let globalIndex = 0;
        for (; globalIndex < this.entityIds.length; globalIndex++) {
            if (this.entityIds[globalIndex] === entityId) break;
        }

        const refEntity = this.getEntity(entityId);
        assert(refEntity !== undefined, `Entity ${entityId} not found`);
        globalIndex++;

        for (; globalIndex < this.entityIds.length; globalIndex++) {
            const entityId = this.entityIds[globalIndex];
            if (ignoreEntityIds.has(entityId)) {
                continue;
            }

            const otherEntity = this.getEntity(entityId);
            assert(otherEntity !== undefined, `Entity ${entityId} not found`);

            if (refEntity.isOverlapWithEntity(otherEntity)) {
                return { entityId: entityId, globalIndex };
            }
        }

        return null;
    }

    /**
     * Find the overlapped entity with the given entity from the entities
     * located behind of it, and return the most-forward entity.
     */
    private findBackwardOverlappedEntity(
        entityId: string,
        ignoreEntityIds: Set<string>,
    ): { entityId: string; globalIndex: number } | null {
        let globalIndex = this.entityIds.length - 1;
        for (; globalIndex >= 0; globalIndex--) {
            if (this.entityIds[globalIndex] === entityId) break;
        }

        const refEntity = this.getEntity(entityId);
        globalIndex--;

        for (; globalIndex >= 0; globalIndex--) {
            const entityId = this.entityIds[globalIndex];
            if (ignoreEntityIds.has(entityId)) {
                continue;
            }

            const otherEntity = this.getEntity(entityId);

            if (refEntity.isOverlapWithEntity(otherEntity)) {
                return { entityId: entityId, globalIndex };
            }
        }

        return null;
    }
}
