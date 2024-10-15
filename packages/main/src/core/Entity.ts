import type { Line } from "../lib/geo/Line";
import type { Point } from "../lib/geo/Point";
import type { Rect } from "../lib/geo/Rect";
import { Transform } from "../lib/geo/Transform";
import type { App } from "./App";
import type { SerializedEntity } from "./EntityDeserializer";
import type { JSONObject } from "./JSONObject";
import type { PathEdge, PathNode } from "./Path";
import type { Viewport } from "./Viewport";

interface Props {
    id: string;
    [key: string]: unknown;
}

export type EntityPropsOf<E extends Entity> = E extends Entity<infer P>
    ? P
    : never;

export abstract class Entity<P extends Props = Props> {
    constructor(readonly props: P) {}

    abstract type: string;

    abstract getBoundingRect(this: this): Rect;

    copy(props: Partial<P>): this {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        return new (this as any).constructor({ ...this.props, ...props });
    }

    getOutlinePath(viewport: Viewport): string {
        const rect = this.getBoundingRect();

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

    serialize(this: this): SerializedEntity {
        return this as unknown as SerializedEntity;
    }

    transform(transform: Transform): this {
        return this;
    }

    isPropertySupported(propertyKey: string): boolean {
        return propertyKey in this.props;
    }

    setProperty(propertyKey: string, value: unknown): this {
        if (!this.isPropertySupported(propertyKey)) return this;

        return this.copy({ [propertyKey]: value } as Partial<P>);
    }

    getProperty<T = unknown>(propertyKey: string): T | undefined {
        return this.props[propertyKey] as T | undefined;
    }

    getNodes(this: this): PathNode[] {
        return [];
    }

    getEdges(this: this): PathEdge[] {
        return [];
    }

    getOutline(this: this): (Rect | Line | Point)[] {
        return [this.getBoundingRect()];
    }

    setNodePosition(nodeId: string, position: Point): this {
        return this;
    }

    getDistance(
        this: this,
        point: Point,
    ): {
        distance: number;
        point: Point;
    } {
        let minResult = { distance: Number.POSITIVE_INFINITY, point: point };

        for (const obj of this.getOutline()) {
            const result = obj.getDistance(point);
            if (result.distance < minResult.distance) {
                minResult = result;
            }
        }

        return minResult;
    }

    isOverlapWithEntity(other: Entity): boolean {
        const objs1 = this.getOutline();
        const objs2 = other.getOutline();

        for (const obj1 of objs1) {
            for (const obj2 of objs2) {
                if (obj1.isOverlappedWith(obj2)) {
                    return true;
                }
            }
        }

        return false;
    }

    isOverlapWith(other: Rect | Line | Point): boolean {
        return this.getOutline().some((obj1) => obj1.isOverlappedWith(other));
    }

    static initialize(app: App): void {}

    static deserialize(serialized: JSONObject): Entity {
        return serialized as unknown as Entity;
    }

    static onViewSizeChange(
        app: App,
        entity: Entity,
        width: number,
        height: number,
    ): void {}
}

export interface EntityConstructor<E extends Entity = Entity> {
    new (props: EntityPropsOf<E>): E;

    initialize(app: App): void;

    onViewSizeChange(app: App, entity: E, width: number, height: number): void;
}
