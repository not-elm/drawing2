import type { ComponentType } from "react";
import { assert } from "../lib/assert";
import type { App } from "./App";
import type { JSONObject, JSONValue } from "./JSONObject";
import type { CanvasPointerEvent } from "./ModeController";
import type { Shape } from "./shape/Shape";
import type { TransformMatrix } from "./shape/TransformMatrix";

export interface Entity extends JSONObject {
    readonly type: string;
    readonly id: string;
}

export abstract class EntityHandle<T extends Entity> {
    abstract type: string;

    abstract transform(entity: T, transform: TransformMatrix): T;

    abstract getShape(entity: T): Shape;

    abstract getView(): ComponentType<{ entity: T }>;

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
     * Called when this entity is tapped. This event is called only in select mode.
     */
    onTap(entity: T, app: App, ev: EntityTapEvent): void {}

    /**
     *  Called when text edit in this entity is started
     */
    onTextEditStart(entity: T, app: App): void {}

    /**
     *  Called when text edit in this entity is ended
     */
    onTextEditEnd(entity: T, app: App): void {}

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

export interface EntityTapEvent extends CanvasPointerEvent {
    /**
     * Entity IDs that are already selected before this tap event happened.
     * Entities that are newly selected by this tap event are not included.
     */
    previousSelectedEntities: ReadonlySet<string>;
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

    transform<T extends Entity>(entity: T, transform: TransformMatrix): T {
        return this.getHandle(entity).transform(entity, transform);
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
}
