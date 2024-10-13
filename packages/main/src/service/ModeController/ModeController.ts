import type { Point } from "../../geo/Point";
import type { Entity } from "../../model/Entity";
import type { Mode } from "../../model/Mode";
import type { PointerDownEventHandlerData } from "../AppController";

export abstract class ModeController {
    abstract getType(): string;

    onBeforeExitMode(mode: Mode): void {}
    onAfterEnterMode(mode: Mode): void {}

    onCanvasPointerDown(data: PointerDownEventHandlerData): void {}
    onCanvasDoubleClick(data: PointerDownEventHandlerData): void {}
    onEntityPointerDown(
        data: PointerDownEventHandlerData,
        entity: Entity,
    ): void {}
    onMouseMove(point: Point): void {}
}
