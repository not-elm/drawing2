import type { Point } from "../geo/Point";
import { assert } from "../lib/assert";
import { testHitEntities } from "../lib/testHitEntities";
import type { ColorId } from "../model/Colors";
import type { FillMode } from "../model/FillMode";
import type { Mode } from "../model/Mode";
import type { StrokeStyle } from "../model/StrokeStyle";
import type { TextAlignment } from "../model/TextAlignment";
import type { TextEntitySizingMode } from "../model/TextEntitySizingMode";
import { Transaction } from "../model/Transaction";
import type { AppStateStore } from "../store/AppStateStore";
import type { BrushStore } from "../store/BrushStore";
import {
    type CanvasStateStore,
    fromCanvasCoordinate,
} from "../store/CanvasStateStore";
import type { PropertyPanelStateStore } from "../store/PropertyPanelStateStore";
import type { SnapGuideStore } from "../store/SnapGuideStore";
import type { ViewportStore } from "../store/ViewportStore";
import type { GestureRecognizer } from "./GestureRecognizer";
import type { HistoryManager } from "./HistoryManager";
import type { ModeController } from "./ModeController/ModeController";

export class AppController {
    constructor(
        readonly canvasStateStore: CanvasStateStore,
        readonly viewportStore: ViewportStore,
        readonly gestureRecognizer: GestureRecognizer,
        readonly appStateStore: AppStateStore,
        readonly propertyPanelStateStore: PropertyPanelStateStore,
        readonly historyManager: HistoryManager,
        readonly snapGuideStore: SnapGuideStore,
        readonly brushStore: BrushStore,
    ) {
        this.gestureRecognizer.onPointerDown = this.handlePointerDown;
    }

    private readonly modeControllers = new Map<string, ModeController>();

    addModeController(controller: ModeController): this {
        assert(
            !this.modeControllers.has(controller.getType()),
            `Mode ${controller.getType()} is already registered`,
        );
        this.modeControllers.set(controller.getType(), controller);
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
        const point = fromCanvasCoordinate(
            ev.clientX,
            ev.clientY,
            this.viewportStore.getState(),
        );
        const data: PointerDownEventHandlerData = {
            pointerId,
            point,
            shiftKey: ev.shiftKey,
            preventDefault: () => ev.preventDefault(),
        };

        const hitResult = testHitEntities(
            this.canvasStateStore.getState().page,
            point,
            this.viewportStore.getState().scale,
        );
        const result = hitResult.entities.at(0);
        if (result !== undefined) {
            this.getModeController().onEntityPointerDown(data, result.target);
            return;
        }

        this.getModeController().onCanvasPointerDown(data);
    };

    handleMouseDown(ev: PointerEvent) {
        this.gestureRecognizer.handlePointerDown(ev);
    }

    handleMouseMove(ev: PointerEvent) {
        this.gestureRecognizer.handlePointerMove(ev);

        const point = fromCanvasCoordinate(
            ev.clientX,
            ev.clientY,
            this.viewportStore.getState(),
        );
        this.getModeController().onMouseMove(point);
    }

    handleMouseUp(ev: PointerEvent) {
        this.gestureRecognizer.handlePointerUp(ev);
    }

    handleDoubleClick(ev: MouseEvent) {
        const point = fromCanvasCoordinate(
            ev.clientX,
            ev.clientY,
            this.viewportStore.getState(),
        );
        this.getModeController().onCanvasDoubleClick({
            point,
            shiftKey: ev.shiftKey,
            pointerId: -1,
            preventDefault: () => ev.preventDefault(),
        });
    }

    startTextEditing(entityId: string) {
        const oldState = this.appStateStore.getState();
        if (
            oldState.mode.type === "edit-text" &&
            oldState.mode.entityId === entityId
        ) {
            return;
        }

        this.canvasStateStore.unselectAll();
        this.canvasStateStore.select(entityId);
        this.setMode({ type: "edit-text", entityId: entityId });
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
                    case "new-path":
                    case "new-shape":
                    case "new-text":
                    case "select": {
                        if (modifiers.metaKey || modifiers.ctrlKey) {
                            this.setMode({ type: "select" });
                            this.canvasStateStore.selectAll();
                            return true;
                        } else {
                            this.setMode({ type: "new-path" });
                            this.appStateStore.setDefaultLineEnd(1, "none");
                            this.appStateStore.setDefaultLineEnd(2, "arrow");
                        }
                    }
                }
                break;
            }
            case "r": {
                switch (this.appStateStore.getState().mode.type) {
                    case "new-path":
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
                    case "new-path":
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
                        this.setMode({ type: "new-path" });
                        this.appStateStore.setDefaultLineEnd(1, "none");
                        this.appStateStore.setDefaultLineEnd(2, "none");
                        return true;
                    }
                }
                break;
            }
            case "z": {
                switch (this.appStateStore.getState().mode.type) {
                    case "new-path":
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
                        this.canvasStateStore.deleteSelectedEntities();
                        return true;
                    }
                }
                break;
            }
        }

        return false;
    }

    handleTextEntitySizeChanged(
        entityId: string,
        width: number,
        height: number,
    ) {
        const entity = this.canvasStateStore.getState().page.entities[entityId];
        assert(entity !== undefined, `Entity ${entityId} is not found`);
        assert(entity.type === "text", `Entity ${entityId} is not text`);

        const newWidth =
            entity.sizingMode === "content" ? width : entity.rect.width;
        const newHeight = height;

        this.canvasStateStore.setPage(
            new Transaction(this.canvasStateStore.getState().page)
                .scaleEntities(
                    [entityId],
                    entity.rect.topLeft,
                    newWidth / entity.rect.width,
                    newHeight / entity.rect.height,
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

    setTextEntityTextAlignment(alignment: TextAlignment) {
        this.canvasStateStore.setTextEntityTextAlignment(alignment);
        this.appStateStore.setDefaultTextEntityTextAlignment(alignment);
    }

    setTextEntitySizingMode(sizingMode: TextEntitySizingMode) {
        this.canvasStateStore.setTextEntitySizingMode(sizingMode);
        this.appStateStore.setDefaultTextEntitySizingMode(sizingMode);
    }

    setStrokeStyle(strokeStyle: StrokeStyle) {
        this.canvasStateStore.setStrokeStyle(strokeStyle);
        this.appStateStore.setDefaultStrokeStyle(strokeStyle);
    }
}

export interface PointerDownEventHandlerData {
    point: Point;
    pointerId: number;
    shiftKey: boolean;
    preventDefault: () => void;
}
