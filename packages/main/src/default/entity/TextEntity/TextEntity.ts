import type { App } from "../../../core/App";
import { Entity } from "../../../core/Entity";
import type { SerializedEntity } from "../../../core/EntityDeserializer";
import type { JSONObject } from "../../../core/JSONObject";
import { Rect } from "../../../lib/geo/Rect";
import type { Transform } from "../../../lib/geo/Transform";
import { type ColorId, PROPERTY_KEY_COLOR_ID } from "../../property/Colors";
import {
    PROPERTY_KEY_SIZING_MODE,
    type SizingMode,
} from "../../property/SizingMode";
import {
    PROPERTY_KEY_TEXT_ALIGNMENT_X,
    type TextAlignment,
} from "../../property/TextAlignment";

export class TextEntity extends Entity<{
    id: string;
    // If sizingMode=auto, width and height will be automatically set by application
    rect: Rect;
    [PROPERTY_KEY_SIZING_MODE]: SizingMode;
    [PROPERTY_KEY_TEXT_ALIGNMENT_X]: TextAlignment;
    [PROPERTY_KEY_COLOR_ID]: ColorId;
    content: string;
}> {
    readonly type = "text";

    getBoundingRect(): Rect {
        return this.props.rect;
    }

    transform(transform: Transform) {
        return this.copy({ rect: this.props.rect.transform(transform) });
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

    static onViewSizeChange(
        app: App,
        entity: TextEntity,
        width: number,
        height: number,
    ) {
        const newWidth =
            entity.props.sizingMode === "content"
                ? width
                : entity.props.rect.width;
        const newHeight = height;

        app.edit((tx) => {
            tx.scaleEntities(
                [entity.props.id],
                entity.props.rect.topLeft,
                newWidth / entity.props.rect.width,
                newHeight / entity.props.rect.height,
            );
        });
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
