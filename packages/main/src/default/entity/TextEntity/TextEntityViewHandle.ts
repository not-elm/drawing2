import type { ComponentType } from "react";
import { EntityViewHandle } from "../../../react/EntityViewMap/EntityViewHandle";
import type { TextEntity } from "./TextEntity";
import { TextView } from "./TextView";

export class TextEntityViewHandle extends EntityViewHandle<TextEntity> {
    getType(): string {
        return "text";
    }

    getViewComponent(): ComponentType<{ entity: TextEntity }> {
        return TextView;
    }
}
