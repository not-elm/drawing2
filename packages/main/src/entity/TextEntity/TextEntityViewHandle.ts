import type { ComponentType } from "react";
import type { AppController } from "../../core/AppController";
import { assert } from "../../lib/assert";
import { EntityViewHandle } from "../../react/EntityViewMap/EntityViewHandle";
import type { TextEntity } from "./TextEntity";
import { TextView } from "./TextView";

export class TextEntityViewHandle extends EntityViewHandle<TextEntity> {
    private appController: AppController = null as never;

    initialize(appController: AppController) {
        this.appController = appController;
    }

    getType(): string {
        return "text";
    }

    getViewComponent(): ComponentType<{ entity: TextEntity }> {
        return TextView;
    }

    onViewSizeChange(entity: TextEntity, width: number, height: number) {
        assert(entity !== undefined, `Entity ${entity.id} is not found`);
        assert(entity.type === "text", `Entity ${entity.id} is not text`);

        const newWidth =
            entity.sizingMode === "content" ? width : entity.rect.width;
        const newHeight = height;

        this.appController.edit((tx) => {
            tx.scaleEntities(
                [entity.id],
                entity.rect.topLeft,
                newWidth / entity.rect.width,
                newHeight / entity.rect.height,
            );
        });
    }
}
