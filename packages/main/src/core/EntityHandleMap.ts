import type {PathEdge, PathNode,} from "../default/entity/PathEntity/PathEntity";
import {assert} from "../lib/assert";
import type {Line} from "../lib/geo/Line";
import type {Point} from "../lib/geo/Point";
import type {Rect} from "../lib/geo/Rect";
import type {Transform} from "../lib/geo/Transform";
import type {EntityOperations} from "./EntityOperations";
import type {Entity} from "./model/Entity";
import type {SerializedEntity} from "./model/SerializedPage";
import type {Viewport} from "./model/Viewport";

export class EntityHandleMap {
    private readonly map = new Map<string, EntityOperations<Entity>>();

    register(handle: EntityOperations<Entity>): this {
        this.map.set(handle.getType(), handle);
        return this;
    }

    onViewSizeChange(entity: Entity, width: number, height: number) {
        this.get(entity.type).onViewSizeChange(entity, width, height);
    }

    transform<E extends Entity>(entity: E, transform: Transform): E {
        return this.get(entity.type).transform(entity, transform) as E;
    }

    isPropertySupported(entity: Entity, propertyKey: string): boolean {
        return this.get(entity.type).isPropertySupported(entity, propertyKey);
    }

    setProperty<E extends Entity>(
        entity: E,
        propertyKey: string,
        value: unknown,
    ): E {
        return this.get(entity.type).setProperty(
            entity,
            propertyKey,
            value,
        ) as E;
    }

    getProperty<T>(entity: Entity, propertyKey: string): T | undefined {
        return this.get(entity.type).getProperty<T>(entity, propertyKey);
    }

    getBoundingRect(entity: Entity): Rect {
        return this.get(entity.type).getBoundingRect(entity);
    }

    getNodes(entity: Entity): PathNode[] {
        return this.get(entity.type).getNodes(entity);
    }

    getEdges(entity: Entity): PathEdge[] {
        return this.get(entity.type).getEdges(entity);
    }

    isOverlapWithEntity(entity1: Entity, entity2: Entity): boolean {
        const objs1 = this.get(entity1.type).getOutline(entity1);
        const objs2 = this.get(entity2.type).getOutline(entity2);

        for (const obj1 of objs1) {
            for (const obj2 of objs2) {
                if (obj1.isOverlappedWith(obj2)) {
                    return true;
                }
            }
        }

        return false;
    }

    isOverlapWith(entity1: Entity, other: Rect | Line | Point): boolean {
        return this.get(entity1.type)
            .getOutline(entity1)
            .some((obj1) => obj1.isOverlappedWith(other));
    }

    serialize(entity: Entity): SerializedEntity {
        return this.get(entity.type).serialize(entity);
    }

    deserialize(data: SerializedEntity): Entity {
        return this.get(data.type).deserialize(data);
    }

    setNodePosition<E extends Entity>(
        entity: E,
        nodeId: string,
        position: Point,
    ): E {
        return this.get(entity.type).setNodePosition(
            entity,
            nodeId,
            position,
        ) as E;
    }

    getDistance(
        entity: Entity,
        point: Point,
    ): {
        distance: number;
        point: Point;
    } {
        return this.get(entity.type).getDistance(entity, point);
    }

    private get(type: string): EntityOperations<Entity> {
        const handle = this.map.get(type);
        assert(
            handle !== undefined,
            `EntityHandleMap.get: handle not found for type ${type}`,
        );

        return handle;
    }

    getOutlinePath(entity: Entity, viewport: Viewport): string {
        return this.get(entity.type).getOutlinePath(entity, viewport);
    }
}
