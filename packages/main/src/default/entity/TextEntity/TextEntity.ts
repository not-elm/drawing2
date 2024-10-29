import type { ComponentType } from "react";
import type { App } from "../../../core/App";
import {
    type Entity,
    EntityHandle,
    type EntityTapEvent,
} from "../../../core/Entity";
import { Rect } from "../../../core/shape/Shape";
import type { TransformMatrix } from "../../../core/shape/TransformMatrix";
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

    transform(entity: TextEntity, transform: TransformMatrix): TextEntity {
        const oldRect = Rect.of(
            entity.x,
            entity.y,
            entity.width,
            entity.height,
        );
        const newRect = transform.apply(oldRect);
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

    onTap(entity: TextEntity, app: App, ev: EntityTapEvent) {
        if (
            ev.previousSelectedEntities.size === 1 &&
            ev.previousSelectedEntities.has(entity.id)
        ) {
            app.setMode(EditTextModeController.MODE_NAME);
        }
    }

    onTextEditEnd(entity: TextEntity, app: App) {
        if (entity.content === "") {
            app.canvasStateStore.edit((draft) => draft.deleteEntity(entity.id));
        }
    }

    onViewResize(entity: TextEntity, app: App, width: number, height: number) {
        const rect = this.getShape(entity);
        const newWidth = entity.sizingMode === "content" ? width : rect.width;
        const newHeight = height;

        app.canvasStateStore.edit((draft) => {
            draft.updateProperty([entity.id], "x", rect.left);
            draft.updateProperty([entity.id], "y", rect.top);
            draft.updateProperty([entity.id], "width", newWidth);
            draft.updateProperty([entity.id], "height", newHeight);
        });
    }
}

export function isTextEntity(entity: Entity): entity is TextEntity {
    return entity.type === "text";
}
