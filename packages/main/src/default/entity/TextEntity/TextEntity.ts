import type { App } from "../../../core/App";
import { Entity, type EntityTapEvent } from "../../../core/Entity";
import type { SerializedEntity } from "../../../core/EntityConverter";
import type { JSONObject } from "../../../core/JSONObject";
import { Rect } from "../../../lib/geo/Rect";
import type { TransformMatrix } from "../../../lib/geo/TransformMatrix";
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
import { PROPERTY_KEY_CONTENT } from "../ShapeEntity/ShapeEntity";

export class TextEntity extends Entity<{
    id: string;
    // If sizingMode=auto, width and height will be automatically set by application
    rect: Rect;
    [PROPERTY_KEY_SIZING_MODE]: SizingMode;
    [PROPERTY_KEY_TEXT_ALIGNMENT_X]: TextAlignment;
    [PROPERTY_KEY_COLOR_ID]: ColorId;
    [PROPERTY_KEY_CONTENT]: string;
}> {
    readonly type = "text";

    getBoundingRect(): Rect {
        return Rect.of(
            this.props.rect.left - 5,
            this.props.rect.top - 5,
            this.props.rect.width + 10,
            this.props.rect.height + 10,
        );
    }

    transform(transform: TransformMatrix) {
        const oldRect = this.props.rect;
        const newRect = transform.apply(this.props.rect);
        const newSizingMode =
            newRect.width !== oldRect.width || newRect.height !== oldRect.height
                ? "fixed"
                : this.props[PROPERTY_KEY_SIZING_MODE];

        return this.copy({
            rect: newRect,
            [PROPERTY_KEY_SIZING_MODE]: newSizingMode,
        });
    }

    serialize(): SerializedEntity {
        return {
            id: this.props.id,
            type: "text",
            x: this.props.rect.left,
            y: this.props.rect.top,
            width: this.props.rect.width,
            height: this.props.rect.height,
            sizingMode: this.props.sizingMode,
            textAlignment: this.props[PROPERTY_KEY_TEXT_ALIGNMENT_X],
            content: this.props.content,
        } satisfies SerializedTextEntity;
    }

    static deserialize(data: JSONObject): TextEntity {
        const serialized = data as unknown as SerializedTextEntity;

        return new TextEntity({
            id: serialized.id,
            rect: Rect.of(
                serialized.x,
                serialized.y,
                serialized.width,
                serialized.height,
            ),
            sizingMode: serialized.sizingMode,
            [PROPERTY_KEY_TEXT_ALIGNMENT_X]: serialized.textAlignment,
            [PROPERTY_KEY_COLOR_ID]: 0,
            content: serialized.content,
        });
    }

    onTap(app: App, ev: EntityTapEvent) {
        if (ev.selectedOnlyThisEntity) {
            app.setMode(EditTextModeController.createMode(this.props.id));
        }
    }

    onTextEditEnd(app: App) {
        if (this.props.content === "") {
            app.canvasStateStore.edit((draft) =>
                draft.deleteEntity(this.props.id),
            );
        }
    }

    onViewResize(app: App, width: number, height: number) {
        const newWidth =
            this.props.sizingMode === "content" ? width : this.props.rect.width;
        const newHeight = height;

        app.canvasStateStore.updateProperty(
            "rect",
            Rect.fromSize(this.props.rect.topLeft, newWidth, newHeight),
        );
    }
}

interface SerializedTextEntity extends SerializedEntity {
    id: string;
    type: "text";
    x: number;
    y: number;
    width: number;
    height: number;
    sizingMode: SizingMode;
    textAlignment: TextAlignment;
    content: string;
}
