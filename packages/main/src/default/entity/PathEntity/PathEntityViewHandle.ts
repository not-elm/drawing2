import type { ComponentType } from "react";
import { EntityViewHandle } from "../../../react/EntityViewMap/EntityViewHandle";
import type { PathEntity } from "./PathEntity";
import { PathView } from "./PathView";

export class PathEntityViewHandle extends EntityViewHandle<PathEntity> {
    getType(): string {
        return "path";
    }

    getViewComponent(): ComponentType<{ entity: PathEntity }> {
        return PathView;
    }
}
