import type { AppController } from "../../core/AppController";
import { EntityHandle } from "../../core/EntityHandle";
import type { SerializedEntity } from "../../core/model/SerializedPage";
import type { TextAlignment } from "../../core/model/TextAlignment";
import type { TextEntitySizingMode } from "../../core/model/TextEntitySizingMode";
import { assert } from "../../lib/assert";
import { Rect } from "../../lib/geo/Rect";
import type { Transform } from "../../lib/geo/Transform";
import type { TextEntity } from "./TextEntity";

export class TextEntityHandle extends EntityHandle<TextEntity> {
    initialize(appController: AppController) {
        appController.on("beforeExitMode", (ev) => {
            if (ev.oldMode.type === "edit-text") {
                const entityId = ev.oldMode.entityId;
                const entity =
                    appController.canvasStateStore.getState().page.entities[
                        entityId
                    ];
                assert(entity !== undefined, `Entity ${entityId} is not found`);
                if (entity.type === "text") {
                    const textEntity = entity as TextEntity;
                    if (textEntity.content === "") {
                        appController.edit((tx) => {
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
            textAlignment: entity.textAlignment,
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
            textAlignment: serialized.textAlignment,
            content: serialized.content,
        };
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
