import type { Mode } from "../../model/Mode";
import type { Block } from "../../model/Page";
import type { PointerDownEventHandlerData } from "../Controller";

export abstract class ModeController {
    onBeforeExitMode(mode: Mode): void {}
    onAfterEnterMode(mode: Mode): void {}

    onCanvasPointerDown(data: PointerDownEventHandlerData): void {}
    onCanvasDoubleClick(data: PointerDownEventHandlerData): void {}
    onBlockPointerDown(data: PointerDownEventHandlerData, block: Block): void {}
    onMouseMove(x: number, y: number): void {}
}
