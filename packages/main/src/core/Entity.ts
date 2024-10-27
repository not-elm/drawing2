import type { App } from "./App";
import type { SerializedEntity } from "./EntityConverter";
import type { JSONObject } from "./JSONObject";
import type { CanvasPointerEvent } from "./ModeController";
import type { GraphEdge, GraphNode } from "./shape/Graph";
import type { Point } from "./shape/Point";
import type { Rect, Shape } from "./shape/Shape";
import type { TransformMatrix } from "./shape/TransformMatrix";

export interface EntityProps {
    id: string;
    [key: string]: unknown;
}

export abstract class Entity<P extends EntityProps = EntityProps> {
    constructor(readonly props: P) {}

    abstract type: string;

    abstract getShape(): Shape;

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

    getNodes(): GraphNode[] {
        return [];
    }

    getNodeById(nodeId: string): GraphNode | undefined {
        return this.getNodes().find((node) => node.id === nodeId);
    }

    getEdges(): GraphEdge[] {
        return [];
    }

    getBoundingRect(): Rect {
        return this.getShape().getBoundingRect();
    }

    setNodePosition(nodeId: string, position: Point): Entity {
        return this;
    }

    getDistance(point: Point): {
        distance: number;
        point: Point;
    } {
        return this.getShape().getDistance(point);
    }

    isOverlapWithEntity(other: Entity): boolean {
        return other.getShape().isOverlapWith(this.getShape());
    }

    isOverlapWith(other: Shape): boolean {
        return this.getShape().isOverlapWith(other);
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
     * Called when a transform session happened in select-entity mode is ended.
     * @param app
     */
    onTransformEnd(app: App): void {}

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
    previousSelectedEntities: ReadonlySet<string>;
}
