import { assert } from "../lib/assert";
import { testHitEntities } from "../lib/testHitEntities";
import type { ColorId } from "../model/Colors";
import type { FillMode } from "../model/FillMode";
import type { Mode } from "../model/Mode";
import type { StrokeStyle } from "../model/StrokeStyle";
import type { TextAlignment } from "../model/TextAlignment";
import type { TextBlockSizingMode } from "../model/TextBlockSizingMode";
import { Transaction } from "../model/Transaction";
import { AppStateStore } from "../store/AppStateStore";
import { BrushStore } from "../store/BrushStore";
import {
    CanvasStateStore,
    fromCanvasCoordinate,
} from "../store/CanvasStateStore";
import { PropertyPanelStateStore } from "../store/PropertyPanelStateStore";
import { SnapGuideStore } from "../store/SnapGuideStore";
import { ViewportStore } from "../store/ViewportStore";
import { GestureRecognizer } from "./GestureRecognizer";
import { HistoryManager } from "./HistoryManager";
import type { ModeController } from "./ModeController/ModeController";
import { getRestoreViewportService } from "./RestoreViewportService";

export class Controller {
    readonly canvasStateStore = new CanvasStateStore();
    readonly viewportStore = new ViewportStore(getRestoreViewportService());
    readonly gestureRecognizer = new GestureRecognizer(this.viewportStore);
    readonly appStateStore = new AppStateStore();
    readonly propertyPanelStateStore = new PropertyPanelStateStore(
        this.canvasStateStore,
        this.appStateStore,
    );
    readonly historyManager = new HistoryManager(this.canvasStateStore);
    readonly snapGuideStore = new SnapGuideStore();
    readonly brushStore = new BrushStore();

    private readonly modeControllers = new Map<string, ModeController>();

    constructor() {
        this.gestureRecognizer.onPointerDown = this.handlePointerDown;
    }

    addModeController(type: string, controller: ModeController): this {
        this.modeControllers.set(type, controller);
        return this;
    }

    getModeController(): ModeController {
        const modeController = this.modeControllers.get(
            this.appStateStore.getState().mode.type,
        );
        assert(
            modeController !== undefined,
            `Mode controller for ${
                this.appStateStore.getState().mode.type
            } is not found`,
        );

        return modeController;
    }

    setMode(newMode: Mode) {
        assert(
            this.modeControllers.has(newMode.type),
            `Mode ${newMode.type} is not found`,
        );
        const oldMode = this.appStateStore.getState().mode;
        this.getModeController().onBeforeExitMode(oldMode);
        this.appStateStore.setMode(newMode);
        this.getModeController().onAfterEnterMode(newMode);
    }

    private readonly handlePointerDown = (
        ev: PointerEvent,
        pointerId: number,
    ) => {
        const [x, y] = fromCanvasCoordinate(
            ev.clientX,
            ev.clientY,
            this.viewportStore.getState(),
        );
        const data: PointerDownEventHandlerData = {
            pointerId,
            x,
            y,
            shiftKey: ev.shiftKey,
            preventDefault: () => ev.preventDefault(),
        };

        const hitResult = testHitEntities(
            this.canvasStateStore.getState().page,
            x,
            y,
            this.viewportStore.getState().scale,
        );
        const result = hitResult.blocks.at(0);
        if (result !== undefined) {
            this.getModeController().onBlockPointerDown(data, result.target);
            return;
        }

        this.getModeController().onCanvasPointerDown(data);
    };

    handleMouseDown(ev: PointerEvent) {
        this.gestureRecognizer.handlePointerDown(ev);
    }

    handleMouseMove(ev: PointerEvent) {
        this.gestureRecognizer.handlePointerMove(ev);

        const [x, y] = fromCanvasCoordinate(
            ev.clientX,
            ev.clientY,
            this.viewportStore.getState(),
        );
        this.getModeController().onMouseMove(x, y);
    }

    handleMouseUp(ev: PointerEvent) {
        this.gestureRecognizer.handlePointerUp(ev);
    }

    handleDoubleClick(ev: MouseEvent) {
        const [x, y] = fromCanvasCoordinate(
            ev.clientX,
            ev.clientY,
            this.viewportStore.getState(),
        );
        this.getModeController().onCanvasDoubleClick({
            x,
            y,
            shiftKey: ev.shiftKey,
            pointerId: -1,
            preventDefault: () => ev.preventDefault(),
        });
    }

    startTextEditing(blockId: string) {
        const oldState = this.appStateStore.getState();
        if (
            oldState.mode.type === "edit-text" &&
            oldState.mode.blockId === blockId
        ) {
            return;
        }

        this.canvasStateStore.unselectAll();
        this.canvasStateStore.select(blockId);
        this.setMode({ type: "edit-text", blockId });
    }

    handleScroll(deltaCanvasX: number, deltaCanvasY: number) {
        this.viewportStore.movePosition(deltaCanvasX, deltaCanvasY);
    }

    handleScale(
        newScale: number,
        centerCanvasX: number,
        centerCanvasY: number,
    ) {
        this.viewportStore.setScale(newScale, centerCanvasX, centerCanvasY);
    }

    handleKeyDown(
        key: string,
        modifiers: { metaKey: boolean; ctrlKey: boolean; shiftKey: boolean },
    ): boolean {
        switch (key) {
            case "a": {
                switch (this.appStateStore.getState().mode.type) {
                    case "new-line":
                    case "new-shape":
                    case "new-text":
                    case "select": {
                        if (modifiers.metaKey || modifiers.ctrlKey) {
                            this.setMode({ type: "select" });
                            this.canvasStateStore.selectAll();
                            return true;
                        } else {
                            this.setMode({ type: "new-line" });
                            this.appStateStore.setDefaultLineEnd(1, "none");
                            this.appStateStore.setDefaultLineEnd(2, "arrow");
                        }
                    }
                }
                break;
            }
            case "r": {
                switch (this.appStateStore.getState().mode.type) {
                    case "new-line":
                    case "new-text":
                    case "select": {
                        this.setMode({ type: "new-shape" });
                        return true;
                    }
                }
                break;
            }
            case "t": {
                switch (this.appStateStore.getState().mode.type) {
                    case "new-shape":
                    case "new-line":
                    case "select": {
                        this.setMode({ type: "new-text" });
                        return true;
                    }
                }
                break;
            }
            case "l": {
                switch (this.appStateStore.getState().mode.type) {
                    case "new-shape":
                    case "select": {
                        this.setMode({ type: "new-line" });
                        this.appStateStore.setDefaultLineEnd(1, "none");
                        this.appStateStore.setDefaultLineEnd(2, "none");
                        return true;
                    }
                }
                break;
            }
            case "z": {
                switch (this.appStateStore.getState().mode.type) {
                    case "new-line":
                    case "new-shape":
                    case "select": {
                        if (modifiers.metaKey || modifiers.ctrlKey) {
                            if (modifiers.shiftKey) {
                                this.historyManager.redo();
                            } else {
                                this.historyManager.undo();
                            }
                            return true;
                        }
                    }
                }
                break;
            }
            case "x": {
                switch (this.appStateStore.getState().mode.type) {
                    case "select": {
                        if (modifiers.metaKey || modifiers.ctrlKey) {
                            this.canvasStateStore.cut();
                        }
                        return true;
                    }
                }
                break;
            }
            case "c": {
                switch (this.appStateStore.getState().mode.type) {
                    case "select": {
                        if (modifiers.metaKey || modifiers.ctrlKey) {
                            this.canvasStateStore.copy();
                        }
                        return true;
                    }
                }
                break;
            }
            case "v": {
                switch (this.appStateStore.getState().mode.type) {
                    case "select": {
                        if (modifiers.metaKey || modifiers.ctrlKey) {
                            this.canvasStateStore.paste();
                        }
                        return true;
                    }
                }
                break;
            }
            case "Escape": {
                switch (this.appStateStore.getState().mode.type) {
                    case "select": {
                        this.canvasStateStore.unselectAll();
                        return true;
                    }
                    default: {
                        this.setMode({ type: "select" });
                        return true;
                    }
                }
            }
            case "Delete":
            case "Backspace": {
                switch (this.appStateStore.getState().mode.type) {
                    case "select": {
                        this.canvasStateStore.deleteSelectedBlocks();
                        return true;
                    }
                }
                break;
            }
        }

        return false;
    }

    handleTextBlockSizeChanged(blockId: string, width: number, height: number) {
        const block = this.canvasStateStore.getState().page.blocks[blockId];
        assert(block !== undefined, `Block ${blockId} is not found`);
        assert(block.type === "text", `Block ${blockId} is not text`);

        const newWidth = block.sizingMode === "content" ? width : block.width;
        const newHeight = height;

        this.canvasStateStore.setPage(
            new Transaction(this.canvasStateStore.getState().page)
                .scaleBlocks(
                    [blockId],
                    block.x,
                    block.y,
                    newWidth / block.width,
                    newHeight / block.height,
                )
                .commit(),
        );
    }

    setTextAlign(alignX: TextAlignment, alignY: TextAlignment) {
        this.canvasStateStore.setTextAlign(alignX, alignY);
        this.appStateStore.setDefaultTextAlign(alignX, alignY);
    }

    setColor(colorId: ColorId) {
        this.canvasStateStore.setColor(colorId);
        this.appStateStore.setDefaultColor(colorId);
    }

    setFillMode(fillMode: FillMode) {
        this.canvasStateStore.setFillMode(fillMode);
        this.appStateStore.setDefaultFillMode(fillMode);
    }

    setLineEndType(lineEnd: 1 | 2, endType: LineEndType) {
        this.canvasStateStore.setLineEndType(lineEnd, endType);
        this.appStateStore.setDefaultLineEnd(lineEnd, endType);
    }

    setTextBlockTextAlignment(alignment: TextAlignment) {
        this.canvasStateStore.setTextBlockTextAlignment(alignment);
        this.appStateStore.setDefaultTextBlockTextAlignment(alignment);
    }

    setTextBlockSizingMode(sizingMode: TextBlockSizingMode) {
        this.canvasStateStore.setTextBlockSizingMode(sizingMode);
        this.appStateStore.setDefaultTextBlockSizingMode(sizingMode);
    }

    setStrokeStyle(strokeStyle: StrokeStyle) {
        this.canvasStateStore.setStrokeStyle(strokeStyle);
        this.appStateStore.setDefaultStrokeStyle(strokeStyle);
    }
}

export interface PointerDownEventHandlerData {
    x: number;
    y: number;
    pointerId: number;
    shiftKey: boolean;
    preventDefault: () => void;
}
