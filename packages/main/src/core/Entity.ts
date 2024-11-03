import type { ComponentType } from "react";
import type { JSONObject, JSONValue } from "../lib/JSONObject";
import { assert } from "../lib/assert";
import type { App } from "./App";
import type { CanvasPointerEvent } from "./ModeController";
import type { Point } from "./shape/Point";
import type { Shape } from "./shape/Shape";
import type { TransformMatrix } from "./shape/TransformMatrix";

export interface Entity extends JSONObject {
    readonly type: string;
    readonly id: string;
}

export abstract class EntityHandle<T extends Entity> {
    abstract type: string;

    /**
     * Returns the shape of this entity.
     */
    abstract getShape(entity: T): Shape;

    abstract getView(): ComponentType<{ entity: T }>;

    /**
     * Returns the SVG element representation of this entity.
     * This method is used in exporting the entity as SVG.
     */
    getSVGElement(entity: T): SVGElement | null {
        return null;
    }

    isPropertySupported(entity: T, propertyKey: string): boolean {
        return propertyKey in entity;
    }

    setProperty(entity: T, propertyKey: string, value: JSONValue): T {
        return { ...entity, [propertyKey]: value };
    }

    getProperty<U = unknown>(
        entity: T,
        propertyKey: string,
        defaultValue: U,
    ): U {
        return propertyKey in entity
            ? (entity[propertyKey as keyof T] as U)
            : defaultValue;
    }

    /**
     * Returns snap points of this entity.
     * Snap points are used in snapping during entity transformation.
     * @param entity the entity
     */
    getSnapPoints(entity: T): Point[] {
        const rect = this.getShape(entity).getBoundingRect();
        return [
            rect.topLeft,
            rect.topRight,
            rect.bottomLeft,
            rect.bottomRight,
            rect.center,
        ];
    }

    /**
     * Called when this entity is tapped. This event is called only in select mode.
     */
    onTap(entity: T, app: App, ev: TapEntityEvent): void {}

    /**
     *  Called when text edit in this entity is started
     */
    onTextEditStart(entity: T, app: App): void {}

    /**
     *  Called when text edit in this entity is ended
     */
    onTextEditEnd(entity: T, app: App): void {}

    onTransform(entity: T, ev: TransformEvent): T {
        return entity;
    }

    /**
     * Called when a transform session happened in select-entity mode is ended.
     */
    onTransformEnd(entity: T, app: App): void {}

    /**
     *  Called when entity view is resized by browser's layout engine. This
     *  event is not called when this entity is resized by user interaction.
     */
    onViewResize(entity: T, app: App, width: number, height: number): void {}
}

export class EntityHandleMap {
    private readonly map = new Map<string, EntityHandle<Entity>>();

    set<T extends Entity>(handle: EntityHandle<T>): void {
        this.map.set(handle.type, handle as unknown as EntityHandle<Entity>);
    }

    getHandle<T extends Entity>(entity: T): EntityHandle<T> {
        return this.getHandleByType(entity.type) as unknown as EntityHandle<T>;
    }

    getHandleByType(type: string): EntityHandle<Entity> {
        const handle = this.map.get(type);
        assert(handle !== undefined, `Unknown entity type: ${type}`);
        return handle;
    }

    getShape(entity: Entity): Shape {
        return this.getHandle(entity).getShape(entity);
    }

    getSVGElement(entity: Entity): SVGElement | null {
        return this.getHandle(entity).getSVGElement(entity);
    }

    transform<T extends Entity>(entity: T, transform: TransformMatrix): T {
        return this.getHandle(entity).onTransform(entity, {
            transform,
        });
    }

    isPropertySupported(entity: Entity, propertyKey: string): boolean {
        return this.getHandle(entity).isPropertySupported(entity, propertyKey);
    }

    setProperty<T extends Entity>(
        entity: T,
        propertyKey: string,
        value: JSONValue,
    ): T {
        return this.getHandle(entity).setProperty(entity, propertyKey, value);
    }

    getProperty<U = unknown>(
        entity: Entity,
        propertyKey: string,
        defaultValue: U,
    ): U {
        return this.getHandle(entity).getProperty(
            entity,
            propertyKey,
            defaultValue,
        );
    }

    getSnapPoints(entity: Entity): Point[] {
        return this.getHandle(entity).getSnapPoints(entity);
    }
}

export interface TapEntityEvent extends CanvasPointerEvent {
    /**
     * Entity IDs that are already selected before this tap event happened.
     * Entities that are newly selected by this tap event are not included.
     */
    previousSelectedEntities: ReadonlySet<string>;
}

export interface TransformEvent {
    transform: TransformMatrix;
}
