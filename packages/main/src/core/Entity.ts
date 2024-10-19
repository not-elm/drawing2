import type { Line } from "../lib/geo/Line";
import type { Point } from "../lib/geo/Point";
import type { Rect } from "../lib/geo/Rect";
import type { TransformMatrix } from "../lib/geo/TransformMatrix";
import type { App } from "./App";
import type { SerializedEntity } from "./EntityConverter";
import type { JSONObject } from "./JSONObject";
import type { CanvasPointerEvent } from "./ModeController";
import type { PathEdge, PathNode } from "./Path";

export interface EntityProps {
    id: string;
    [key: string]: unknown;
}

export abstract class Entity<P extends EntityProps = EntityProps> {
    constructor(readonly props: P) {}

    abstract type: string;

    abstract getBoundingRect(): Rect;

    abstract setProperty(propertyKey: string, value: unknown): Entity;

    serialize(): SerializedEntity {
        return this as unknown as SerializedEntity;
    }

    transform(transform: TransformMatrix): Entity {
        return this;
    }

    isPropertySupported(propertyKey: string): boolean {
        return propertyKey in this.props;
    }

    getProperty<T = unknown>(propertyKey: string, defaultValue: T): T {
        return (this.props[propertyKey] as T | undefined) ?? defaultValue;
    }

    getNodes(): PathNode[] {
        return [];
    }

    getNodeById(nodeId: string): PathNode | undefined {
        return this.getNodes().find((node) => node.id === nodeId);
    }

    getEdges(): PathEdge[] {
        return [];
    }

    getOutline(): (Rect | Line | Point)[] {
        return [this.getBoundingRect()];
    }

    setNodePosition(nodeId: string, position: Point): Entity {
        return this;
    }

    getDistance(point: Point): {
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

    /**
     * Called when this entity is tapped. This event is called only in select mode.
     */
    onTap(app: App, ev: EntityTapEvent): void {}

    /**
     *  Called when text edit in this entity is started
     */
    onTextEditStart(app: App): void {}

    /**
     *  Called when text edit in this entity is ended
     */
    onTextEditEnd(app: App): void {}

    /**
     *  Called when entity view is resized by browser's layout engine. This
     *  event is not called when this entity is resized by user interaction.
     */
    onViewResize(app: App, width: number, height: number): void {}
}

export interface EntityTapEvent extends CanvasPointerEvent {
    /**
     * Entity IDs that are already selected before this tap event happened.
     * Entities that are newly selected by this tap event are not included.
     */
    previousSelectedEntities: Set<string>;
}
