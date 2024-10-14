import type {PathEdge, PathNode,} from "../default/entity/PathEntity/PathEntity";
import type {Line} from "../lib/geo/Line";
import type {Point} from "../lib/geo/Point";
import type {Rect} from "../lib/geo/Rect";
import {Transform} from "../lib/geo/Transform";
import type {App} from "./App";
import type {Entity} from "./model/Entity";
import type {SerializedEntity} from "./model/SerializedPage";
import type {Viewport} from "./model/Viewport";

export abstract class EntityOperations<E extends Entity> {
    abstract getType(): string;

    abstract getBoundingRect(entity: E): Rect;

    onViewSizeChange(entity: E, width: number, height: number): void {}

    getOutlinePath(entity: E, viewport: Viewport): string {
        const rect = this.getBoundingRect(entity);

        const transform = Transform.translate(
            -viewport.rect.left,
            -viewport.rect.top,
        ).scale(viewport.rect.topLeft, 0, 0);

        return `M${[
            rect.topLeft,
            rect.topRight,
            rect.bottomRight,
            rect.bottomLeft,
        ]
            .map((point) => transform.apply(point))
            .map((canvasPoint) => `${canvasPoint.x},${canvasPoint.y}`)
            .join(", L")} Z`;
    }

    initialize(app: App): void {}

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
