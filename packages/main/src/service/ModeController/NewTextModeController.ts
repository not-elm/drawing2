import type { Rect } from "../../geo/Rect";
import { randomId } from "../../lib/randomId";
import {
    type Block,
    type PointEntity,
    PointKey,
    type TextBlock,
} from "../../model/Page";
import { Transaction } from "../../model/Transaction";
import type { AppStateStore } from "../../store/AppStateStore";
import type { CanvasStateStore } from "../../store/CanvasStateStore";
import type { Controller, PointerDownEventHandlerData } from "../Controller";
import { ModeController } from "./ModeController";

export class NewTextModeController extends ModeController {
    constructor(
        private readonly canvasStateStore: CanvasStateStore,
        private readonly appStateStore: AppStateStore,
        private readonly controller: Controller,
    ) {
        super();
    }

    onBlockPointerDown(data: PointerDownEventHandlerData, _block: Block) {
        this.onCanvasPointerDown(data);
    }

    onCanvasPointerDown(data: PointerDownEventHandlerData): void {
        const [text, p1, p2] = this.insertNewText({
            x: data.x,
            y: data.y,
            width: 1,
            height: 1,
        });

        this.controller.setMode({
            type: "edit-text",
            blockId: text.id,
        });

        // To leave focus at the new text block
        data.preventDefault();
    }

    private insertNewText(rect: Rect): [TextBlock, PointEntity, PointEntity] {
        const p1: PointEntity = {
            type: "point",
            id: randomId(),
            x: rect.x,
            y: rect.y,
        };
        const p2: PointEntity = {
            type: "point",
            id: randomId(),
            x: rect.x + rect.width,
            y: rect.y + rect.height,
        };
        const text: TextBlock = {
            id: randomId(),
            type: "text",
            x: p1.x,
            y: p1.y,
            x1: p1.x,
            y1: p1.y,
            x2: p2.x,
            y2: p2.y,
            width: 1,
            height: 1,
            content: "",
            textAlignment:
                this.appStateStore.getState().defaultTextBlockTextAlignment,
            sizingMode: "content",
        };

        this.canvasStateStore.setPage(
            new Transaction(this.canvasStateStore.getState().page)
                .insertBlocks([text])
                .insertPoints([p1, p2])
                .addDependencies([
                    {
                        id: randomId(),
                        type: "blockToPoint",
                        pointKey: PointKey.TEXT_P1,
                        from: p1.id,
                        to: text.id,
                    },
                    {
                        id: randomId(),
                        type: "blockToPoint",
                        pointKey: PointKey.TEXT_P2,
                        from: p2.id,
                        to: text.id,
                    },
                ])
                .commit(),
        );

        return [text, p1, p2];
    }
}
