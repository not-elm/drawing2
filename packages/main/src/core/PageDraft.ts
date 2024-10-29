import {
    PathEntityHandle,
    isPathEntity,
} from "../default/entity/PathEntity/PathEntity";
import { assert } from "../lib/assert";
import type { Entity, EntityHandleMap } from "./Entity";
import type { JSONValue } from "./JSONObject";
import type { Link, LinkCollection } from "./Link";
import { Page } from "./Page";
import type { Point } from "./shape/Point";
import type { TransformMatrix } from "./shape/TransformMatrix";

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

    constructor(
        page: Page,
        readonly entityHandle: EntityHandleMap,
    ) {
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
        if (!this.entities.has(entity.id)) {
            this.entityIds.push(entity.id);
        }
        this.entities.set(entity.id, entity);

        this.dirtyEntityIds.add(entity.id);
        this.updatedEntityIds.add(entity.id);
        this.deletedEntityIds.delete(entity.id);
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

    deleteEntities(entityIds: ReadonlySet<string>): void {
        for (const entityId of entityIds) {
            this.deleteEntity(entityId);
        }
    }

    transformEntities(entityIds: string[], transform: TransformMatrix) {
        for (const entityId of entityIds) {
            const entity = this.getEntity(entityId);
            this.setEntity(this.entityHandle.transform(entity, transform));
        }
    }

    setPointPosition(pathId: string, nodeId: string, point: Point) {
        const entity = this.getEntity(pathId);
        assert(
            isPathEntity(entity),
            `Entity ${pathId} is not a path: ${entity.type}`,
        );
        this.setEntity(PathEntityHandle.setNodePosition(entity, nodeId, point));
    }

    updateProperty(entityIds: string[], key: string, value: JSONValue) {
        for (const entityId of entityIds) {
            const entity = this.getEntity(entityId);
            this.setEntity(this.entityHandle.setProperty(entity, key, value));
        }
    }

    bringToFront(entityIds: ReadonlySet<string>) {
        return this.bringForwardOf(entityIds, this.entityIds.length - 1);
    }

    bringForward(entityIds: ReadonlySet<string>) {
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

    sendBackward(entityIds: ReadonlySet<string>) {
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

    sendToBack(entityIds: ReadonlySet<string>) {
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
        targetEntityIdSet: ReadonlySet<string>,
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
        targetEntityIdSet: ReadonlySet<string>,
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
        ignoreEntityIds: ReadonlySet<string>,
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

            if (
                this.entityHandle
                    .getShape(refEntity)
                    .isOverlapWith(this.entityHandle.getShape(otherEntity))
            ) {
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
        ignoreEntityIds: ReadonlySet<string>,
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

            if (
                this.entityHandle
                    .getShape(refEntity)
                    .isOverlapWith(this.entityHandle.getShape(otherEntity))
            ) {
                return { entityId: entityId, globalIndex };
            }
        }

        return null;
    }
}
