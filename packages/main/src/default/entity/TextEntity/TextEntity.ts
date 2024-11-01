import type { ComponentType } from "react";
import type { App } from "../../../core/App";
import {
    type Entity,
    EntityHandle,
    type TapEntityEvent,
    type TransformEvent,
} from "../../../core/Entity";
import { Rect } from "../../../core/shape/Shape";
import { EditTextModeController } from "../../mode/EditTextModeController";
import { type ColorId, PROPERTY_KEY_COLOR_ID } from "../../property/Colors";
import {
    PROPERTY_KEY_SIZING_MODE,
    type SizingMode,
} from "../../property/SizingMode";
import {
    PROPERTY_KEY_TEXT_ALIGNMENT_X,
    type TextAlignment,
} from "../../property/TextAlignment";
import { TextView } from "./TextView";

export const PROPERTY_KEY_CONTENT = "content";

export interface TextEntity extends Entity {
    readonly type: "text";
    readonly id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    [PROPERTY_KEY_SIZING_MODE]: SizingMode;
    [PROPERTY_KEY_TEXT_ALIGNMENT_X]: TextAlignment;
    [PROPERTY_KEY_COLOR_ID]: ColorId;
    [PROPERTY_KEY_CONTENT]: string;
}

export class TextEntityHandle extends EntityHandle<TextEntity> {
    public readonly type = "text";

    getShape(entity: TextEntity): Rect {
        return Rect.of(entity.x, entity.y, entity.width, entity.height);
    }

    getView(): ComponentType<{ entity: TextEntity }> {
        return TextView;
    }

    onTransform(entity: TextEntity, ev: TransformEvent): TextEntity {
        const oldRect = Rect.of(
            entity.x,
            entity.y,
            entity.width,
            entity.height,
        );
        const newRect = ev.transform.apply(oldRect);
        const newSizingMode =
            newRect.width !== oldRect.width || newRect.height !== oldRect.height
                ? "fixed"
                : entity[PROPERTY_KEY_SIZING_MODE];
        return {
            ...entity,
            x: newRect.left,
            y: newRect.top,
            width: newRect.width,
            height: newRect.height,
            [PROPERTY_KEY_SIZING_MODE]: newSizingMode,
        };
    }

    onTap(entity: TextEntity, app: App, ev: TapEntityEvent) {
        if (
            ev.previousSelectedEntities.size === 1 &&
            ev.previousSelectedEntities.has(entity.id)
        ) {
            app.setMode(EditTextModeController.type);
        }
    }

    onTextEditEnd(entity: TextEntity, app: App) {
        if (entity.content === "") {
            app.canvas.edit((builder) => builder.deleteEntity(entity.id));
        }
    }

    onViewResize(entity: TextEntity, app: App, width: number, height: number) {
        const rect = this.getShape(entity);
        const newWidth = entity.sizingMode === "content" ? width : rect.width;
        const newHeight = height;

        app.canvas.edit((builder) => {
            builder.updateProperty([entity.id], "x", rect.left);
            builder.updateProperty([entity.id], "y", rect.top);
            builder.updateProperty([entity.id], "width", newWidth);
            builder.updateProperty([entity.id], "height", newHeight);
        });
    }
}

export function isTextEntity(entity: Entity): entity is TextEntity {
    return entity.type === "text";
}
