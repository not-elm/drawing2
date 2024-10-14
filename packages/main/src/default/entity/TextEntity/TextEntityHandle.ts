import type {App} from "../../../core/App";
import {EntityOperations} from "../../../core/EntityOperations";
import {PropertyKey} from "../../../core/model/PropertyKey";
import type {SerializedEntity} from "../../../core/model/SerializedPage";
import type {TextAlignment} from "../../../core/model/TextAlignment";
import type {TextEntitySizingMode} from "../../../core/model/TextEntitySizingMode";
import {assert} from "../../../lib/assert";
import {Rect} from "../../../lib/geo/Rect";
import type {Transform} from "../../../lib/geo/Transform";
import type {TextEntity} from "./TextEntity";

export class TextEntityHandle extends EntityOperations<TextEntity> {
    private app: App = null as never;

    initialize(app: App) {
        app.on("beforeExitMode", (ev) => {
            if (ev.oldMode.type === "edit-text") {
                const entityId = ev.oldMode.entityId;
                const entity =
                    app.canvasStateStore.getState().page.entities[entityId];
                assert(entity !== undefined, `Entity ${entityId} is not found`);
                if (entity.type === "text") {
                    const textEntity = entity as TextEntity;
                    if (textEntity.content === "") {
                        app.edit((tx) => {
                            tx.deleteEntities([entityId]);
                        });
                    }
                }
            }
        });
    }

    getType(): string {
        return "text";
    }

    transform(entity: TextEntity, transform: Transform) {
        const p0 = transform.apply(entity.rect.p0);
        const p1 = transform.apply(entity.rect.p1);
        return { ...entity, rect: Rect.fromPoints(p0, p1) };
    }

    getBoundingRect(entity: TextEntity): Rect {
        return entity.rect;
    }

    serialize(entity: TextEntity): SerializedEntity {
        return {
            id: entity.id,
            type: "text",
            x: entity.rect.left,
            y: entity.rect.top,
            width: entity.rect.width,
            height: entity.rect.height,
            sizingMode: entity.sizingMode,
            textAlignment: entity[PropertyKey.TEXT_ALIGNMENT_X],
            content: entity.content,
        } satisfies SerializedTextEntity;
    }

    deserialize(data: SerializedEntity): TextEntity {
        const serialized = data as unknown as SerializedTextEntity;

        return {
            id: serialized.id,
            type: "text",
            rect: Rect.of(
                serialized.x,
                serialized.y,
                serialized.width,
                serialized.height,
            ),
            sizingMode: serialized.sizingMode,
            [PropertyKey.TEXT_ALIGNMENT_X]: serialized.textAlignment,
            [PropertyKey.COLOR_ID]: 0,
            content: serialized.content,
        };
    }

    onViewSizeChange(entity: TextEntity, width: number, height: number) {
        assert(entity !== undefined, `Entity ${entity.id} is not found`);
        assert(entity.type === "text", `Entity ${entity.id} is not text`);

        const newWidth =
            entity.sizingMode === "content" ? width : entity.rect.width;
        const newHeight = height;

        this.app.edit((tx) => {
            tx.scaleEntities(
                [entity.id],
                entity.rect.topLeft,
                newWidth / entity.rect.width,
                newHeight / entity.rect.height,
            );
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
    sizingMode: TextEntitySizingMode;
    textAlignment: TextAlignment;
    content: string;
}
