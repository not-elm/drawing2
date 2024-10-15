import type { ComponentType } from "react";
import { SnapGuideStore } from "../default/mode/select/SnapGuideStore";
import { EventEmitter } from "../lib/EventEmitter";
import { assert } from "../lib/assert";
import { testHitEntities } from "../lib/testHitEntities";
import { AppStateStore } from "./AppStateStore";
import { CanvasStateStore, fromCanvasCoordinate } from "./CanvasStateStore";
import { ClipboardService } from "./ClipboardService";
import { DefaultPropertyStore } from "./DefaultPropertyStore";
import type { Entity, EntityConstructor } from "./Entity";
import { type EntityConverter, EntityConverterMap } from "./EntityDeserializer";
import { GestureRecognizer } from "./GestureRecognizer";
import { HistoryManager } from "./HistoryManager";
import type {
    Mode,
    ModeChangeEvent,
    ModeController,
    PointerDownEvent,
} from "./ModeController";
import { Transaction } from "./Transaction";
import { ViewportStore } from "./ViewportStore";

export class App extends EventEmitter<{
    beforeExitMode: (ev: ModeChangeEvent) => void;
    afterEnterMode: (ev: ModeChangeEvent) => void;
}> {
    readonly entityConverter = new EntityConverterMap();
    readonly clipboardService = new ClipboardService(this.entityConverter);
    readonly canvasStateStore = new CanvasStateStore(this.clipboardService);
    readonly viewportStore = new ViewportStore();
    readonly gestureRecognizer = new GestureRecognizer(this.viewportStore);
    readonly appStateStore = new AppStateStore();
    readonly historyManager = new HistoryManager(this.canvasStateStore);
    readonly defaultPropertyStore = new DefaultPropertyStore();
    private readonly modeControllers = new Map<string, ModeController>();
    private readonly entityViewMap = new Map<
        EntityConstructor<Entity>,
        ComponentType<{ entity: Entity }>
    >();

    // TODO: Move to SelectMode package
    readonly snapGuideStore = new SnapGuideStore();

    addModeController(controller: ModeController): this {
        assert(
            !this.modeControllers.has(controller.getType()),
            `Mode ${controller.getType()} is already registered`,
        );
        this.modeControllers.set(controller.getType(), controller);
        return this;
    }

    getModeController(): ModeController {
        return this.getModeControllerByType(
            this.appStateStore.getState().mode.type,
        );
    }

    getModeControllerByType(type: string): ModeController {
        const modeController = this.modeControllers.get(type);
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
        let aborted = false;
        const ev: ModeChangeEvent = {
            oldMode: this.appStateStore.getState().mode,
            newMode,
            abort: () => {
                aborted = true;
            },
        };

        const oldModeController = this.getModeController();
        const newModeController = this.getModeControllerByType(newMode.type);

        newModeController.onBeforeEnterMode(ev);
        if (aborted) return;

        oldModeController.onBeforeExitMode(ev);
        if (aborted) return;

        this.appStateStore.setMode(newMode);
        ev.abort = () => {
            throw new Error("Abort is called after mode change");
        };

        oldModeController.onAfterExitMode(ev);

        newModeController.onAfterEnterMode(ev);
    }

    registerEntityConverter<T extends string>(
        type: string,
        converter: EntityConverter<T>,
    ): this {
        this.entityConverter.register(type, converter);
        return this;
    }

    registerEntityView<E extends Entity>(
        entityConstructor: EntityConstructor<E>,
        component: ComponentType<{ entity: E }>,
    ): this {
        this.entityViewMap.set(
            entityConstructor,
            component as ComponentType<{ entity: Entity }>,
        );
        return this;
    }

    getEntityView<E extends Entity>(entity: E): ComponentType<{ entity: E }> {
        const view = this.entityViewMap.get(
            entity.constructor as EntityConstructor,
        );
        assert(
            view !== undefined,
            `No view found for entity type ${entity.constructor.name}`,
        );
        return view as ComponentType<{ entity: E }>;
    }

    edit(updater: (tx: Transaction) => void) {
        const tx = new Transaction(this.canvasStateStore.getState().page);
        updater(tx);
        this.canvasStateStore.setPage(tx.commit());
    }

    handleMouseDown(ev: PointerEvent) {
        this.gestureRecognizer.handlePointerDown(ev);

        const point = fromCanvasCoordinate(
            ev.clientX,
            ev.clientY,
            this.viewportStore.getState(),
        );
        const data: PointerDownEvent = {
            pointerId: ev.pointerId,
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

    handleViewSizeChange(entityId: string, width: number, height: number) {
        const entity = this.canvasStateStore.getState().page.entities[entityId];
        assert(entity !== undefined, `Entity ${entityId} is not found`);

        (entity.constructor as EntityConstructor).onViewSizeChange(
            this,
            entity,
            width,
            height,
        );
    }
}
