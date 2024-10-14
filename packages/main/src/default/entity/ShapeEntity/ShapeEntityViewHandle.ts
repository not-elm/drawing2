import type { ComponentType } from "react";
import { EntityViewHandle } from "../../../react/EntityViewMap/EntityViewHandle";
import type { ShapeEntity } from "./ShapeEntity";
import { ShapeView } from "./ShapeView";

export class ShapeEntityViewHandle extends EntityViewHandle<ShapeEntity> {
    getType(): string {
        return "shape";
    }

    getViewComponent(): ComponentType<{ entity: ShapeEntity }> {
        return ShapeView;
    }
}
