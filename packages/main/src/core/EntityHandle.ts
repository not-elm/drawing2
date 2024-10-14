import type { PathEdge, PathNode } from "../entity/PathEntity/PathEntity";
import type { Line } from "../lib/geo/Line";
import type { Point } from "../lib/geo/Point";
import type { Rect } from "../lib/geo/Rect";
import type { Transform } from "../lib/geo/Transform";
import type { AppController } from "./AppController";
import type { Entity } from "./model/Entity";
import type { SerializedEntity } from "./model/SerializedPage";

export abstract class EntityHandle<E extends Entity> {
    abstract getType(): string;

    abstract getBoundingRect(entity: E): Rect;

    initialize(appController: AppController): void {}

    serialize(entity: E): SerializedEntity {
        return entity as unknown as SerializedEntity;
    }

    deserialize(serialized: SerializedEntity): E {
        return serialized as unknown as E;
    }

    transform(entity: E, transform: Transform): E {
        return entity;
    }

    isPropertySupported(entity: E, propertyKey: string): boolean {
        return propertyKey in entity;
    }

    setProperty(entity: E, propertyKey: string, value: unknown): E {
        if (!this.isPropertySupported(entity, propertyKey)) return entity;

        const newEntity = { ...entity };
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        (newEntity as any)[propertyKey] = value;
        return newEntity;
    }

    getProperty<T = unknown>(
        entity: Entity,
        propertyKey: string,
    ): T | undefined {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        return (entity as any)[propertyKey] as T | undefined;
    }

    getNodes(entity: E): PathNode[] {
        return [];
    }

    getEdges(entity: E): PathEdge[] {
        return [];
    }

    getOutline(entity: E): (Rect | Line | Point)[] {
        return [this.getBoundingRect(entity)];
    }

    setNodePosition(entity: E, nodeId: string, position: Point): E {
        return entity;
    }

    getDistance(
        entity: E,
        point: Point,
    ): {
        distance: number;
        point: Point;
    } {
        let minResult = { distance: Number.POSITIVE_INFINITY, point: point };

        for (const obj of this.getOutline(entity)) {
            const result = obj.getDistance(point);
            if (result.distance < minResult.distance) {
                minResult = result;
            }
        }

        return minResult;
    }
}
