import type { ComponentType } from "react";
import type { AppController } from "../../core/AppController";
import type { Entity } from "../../core/model/Entity";
import type { Viewport } from "../../core/model/Viewport";
import { entityHandleMap } from "../../instance";
import { Transform } from "../../lib/geo/Transform";

export abstract class EntityViewHandle<E extends Entity> {
    abstract getType(): string;

    abstract getViewComponent(entity: E): ComponentType<{ entity: E }>;

    initialize(appController: AppController): void {}

    getOutline(entity: E, viewport: Viewport): string {
        const rect = entityHandleMap().getBoundingRect(entity);

        const transform = Transform.translate(
            -viewport.rect.left,
            -viewport.rect.top,
        ).scale(viewport.rect.topLeft, 0, 0);

        return `M${[
            rect.topLeft,
            rect.topRight,
            rect.bottomRight,
            rect.bottomLeft,
        ]
            .map((point) => transform.apply(point))
            .map((canvasPoint) => `${canvasPoint.x},${canvasPoint.y}`)
            .join(", L")} Z`;
    }

    onViewSizeChange(entity: E, width: number, height: number): void {}
}
