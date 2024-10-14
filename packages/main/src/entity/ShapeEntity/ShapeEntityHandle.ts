import { EntityHandle } from "../../core/EntityHandle";
import type { ColorId } from "../../core/model/Colors";
import type { FillMode } from "../../core/model/FillMode";
import type { SerializedEntity } from "../../core/model/SerializedPage";
import type { StrokeStyle } from "../../core/model/StrokeStyle";
import type { TextAlignment } from "../../core/model/TextAlignment";
import { Rect } from "../../lib/geo/Rect";
import type { Transform } from "../../lib/geo/Transform";
import type { ShapeEntity } from "./ShapeEntity";

export class ShapeEntityHandle extends EntityHandle<ShapeEntity> {
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
            textAlignX: entity.textAlignX,
            textAlignY: entity.textAlignY,
            colorId: entity.colorId,
            fillMode: entity.fillMode,
            strokeStyle: entity.strokeStyle,
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
            textAlignX: serialized.textAlignX,
            textAlignY: serialized.textAlignY,
            colorId: serialized.colorId,
            fillMode: serialized.fillMode,
            strokeStyle: serialized.strokeStyle,
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
    fillMode: FillMode;
    strokeStyle: StrokeStyle;
    path: number[][];
}
