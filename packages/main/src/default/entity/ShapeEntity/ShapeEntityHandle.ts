import {EntityOperations} from "../../../core/EntityOperations";
import type {ColorId} from "../../../core/model/Colors";
import type {FillStyle} from "../../../core/model/FillStyle";
import {PropertyKey} from "../../../core/model/PropertyKey";
import type {SerializedEntity} from "../../../core/model/SerializedPage";
import type {StrokeStyle} from "../../../core/model/StrokeStyle";
import type {TextAlignment} from "../../../core/model/TextAlignment";
import {Rect} from "../../../lib/geo/Rect";
import type {Transform} from "../../../lib/geo/Transform";
import type {ShapeEntity} from "./ShapeEntity";

export class ShapeEntityHandle extends EntityOperations<ShapeEntity> {
    getType(): string {
        return "shape";
    }

    transform(entity: ShapeEntity, transform: Transform) {
        const p0 = transform.apply(entity.rect.p0);
        const p1 = transform.apply(entity.rect.p1);
        return { ...entity, rect: Rect.fromPoints(p0, p1) };
    }

    getBoundingRect(entity: ShapeEntity): Rect {
        return entity.rect;
    }

    serialize(entity: ShapeEntity): SerializedEntity {
        return {
            id: entity.id,
            type: "shape",
            x: entity.rect.left,
            y: entity.rect.top,
            width: entity.rect.width,
            height: entity.rect.height,
            label: entity.content,
            textAlignX: entity[PropertyKey.TEXT_ALIGNMENT_X],
            textAlignY: entity[PropertyKey.TEXT_ALIGNMENT_Y],
            colorId: entity[PropertyKey.COLOR_ID],
            fillStyle: entity[PropertyKey.FILL_STYLE],
            strokeStyle: entity[PropertyKey.STROKE_STYLE],
            path: entity.path,
        } satisfies SerializedShapeEntity;
    }

    deserialize(data: SerializedEntity): ShapeEntity {
        const serialized = data as unknown as SerializedShapeEntity;

        return {
            id: serialized.id,
            type: "shape",
            rect: Rect.of(
                serialized.x,
                serialized.y,
                serialized.width,
                serialized.height,
            ),
            content: serialized.label,
            [PropertyKey.TEXT_ALIGNMENT_X]: serialized.textAlignX,
            [PropertyKey.TEXT_ALIGNMENT_Y]: serialized.textAlignY,
            [PropertyKey.COLOR_ID]: serialized.colorId,
            [PropertyKey.FILL_STYLE]: serialized.fillStyle,
            [PropertyKey.STROKE_STYLE]: serialized.strokeStyle,
            path: serialized.path,
        };
    }
}

interface SerializedShapeEntity extends SerializedEntity {
    id: string;
    type: "shape";
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    textAlignX: TextAlignment;
    textAlignY: TextAlignment;
    colorId: ColorId;
    fillStyle: FillStyle;
    strokeStyle: StrokeStyle;
    path: number[][];
}
