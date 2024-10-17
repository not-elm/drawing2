import type { ComponentType } from "react";
import { assert } from "../lib/assert";
import { Point } from "../lib/geo/Point";
import { AppStateStore } from "./AppStateStore";
import { CanvasStateStore } from "./CanvasStateStore";
import { ClipboardService } from "./ClipboardService";
import { DefaultPropertyStore } from "./DefaultPropertyStore";
import type { Entity } from "./Entity";
import { type EntityConverter, EntityConverterMap } from "./EntityConverter";
import { GestureRecognizer } from "./GestureRecognizer";
import { HistoryManager } from "./HistoryManager";
import type { Mode, ModeChangeEvent, ModeController } from "./ModeController";
import { SelectModeController } from "./SelectModeController";
import { SnapGuideStore } from "./SnapGuideStore";
import { ViewportStore } from "./ViewportStore";

export class App {
    readonly entityConverter = new EntityConverterMap();
    readonly clipboardService = new ClipboardService(this.entityConverter);
    readonly canvasStateStore = new CanvasStateStore(this.clipboardService);
    readonly viewportStore = new ViewportStore();
    readonly gestureRecognizer = new GestureRecognizer(this);
    readonly appStateStore = new AppStateStore();
    readonly historyManager = new HistoryManager(this.canvasStateStore);
    readonly defaultPropertyStore = new DefaultPropertyStore();
    private readonly modeControllers = new Map<string, ModeController>();
    private readonly entityViewMap = new Map<
        string,
        ComponentType<{ entity: Entity }>
    >();
    private readonly defaultModeController = new SelectModeController();

    // TODO: Move to SelectMode package
    readonly snapGuideStore = new SnapGuideStore();

    constructor() {
        this.addModeController("select", this.defaultModeController);
    }

    addModeController(type: string, controller: ModeController): this {
        assert(
            !this.modeControllers.has(type),
            `Mode ${type} is already registered`,
        );
        this.modeControllers.set(type, controller);
        return this;
    }

    getModeController(): ModeController {
        return (
            this.getModeControllerByType(
                this.appStateStore.getState().mode.type,
            ) ?? this.defaultModeController
        );
    }

    getModeControllerByType(type: string): ModeController | null {
        return this.modeControllers.get(type) ?? null;
    }

    setMode(newMode: Mode) {
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
        if (newModeController === null) {
            return;
        }

        newModeController.onBeforeEnterMode(this, ev);
        if (aborted) return;

        oldModeController.onBeforeExitMode(this, ev);
        if (aborted) return;

        this.appStateStore.setMode(newMode);
        ev.abort = () => {
            throw new Error("Abort is called after mode change");
        };

        oldModeController.onAfterExitMode(this, ev);

        newModeController.onAfterEnterMode(this, ev);
    }

    registerEntityConverter<T extends string>(
        type: string,
        converter: EntityConverter<T>,
    ): this {
        this.entityConverter.register(type, converter);
        return this;
    }

    registerEntityView<E extends Entity>(
        type: string,
        component: ComponentType<{ entity: E }>,
    ): this {
        this.entityViewMap.set(
            type,
            component as ComponentType<{ entity: Entity }>,
        );
        return this;
    }

    getEntityView<E extends Entity>(entity: E): ComponentType<{ entity: E }> {
        const view = this.entityViewMap.get(entity.type);
        assert(
            view !== undefined,
            `No view found for entity type ${entity.constructor.name}`,
        );
        return view as ComponentType<{ entity: E }>;
    }

    handlePointerDown(ev: PointerEvent) {
        this.gestureRecognizer.handlePointerDown(ev);

        this.getModeController().onCanvasPointerDown(this, {
            pointerId: ev.pointerId,
            point: this.viewportStore
                .getState()
                .fromCanvasCoordinateTransform.apply(
                    new Point(ev.clientX, ev.clientY),
                ),
            shiftKey: ev.shiftKey,
            metaKey: ev.metaKey,
            ctrlKey: ev.ctrlKey,
            preventDefault: () => ev.preventDefault(),
        });
    }

    handlePointerMove(ev: PointerEvent) {
        this.gestureRecognizer.handlePointerMove(ev);

        const point = this.viewportStore
            .getState()
            .fromCanvasCoordinateTransform.apply(
                new Point(ev.clientX, ev.clientY),
            );
        this.getModeController().onMouseMove(this, point);
    }

    handlePointerUp(ev: PointerEvent) {
        this.gestureRecognizer.handlePointerUp(ev);
    }

    handleDoubleClick(ev: MouseEvent) {
        this.getModeController().onCanvasDoubleClick(this, {
            pointerId: -1,
            point: this.viewportStore
                .getState()
                .fromCanvasCoordinateTransform.apply(
                    new Point(ev.clientX, ev.clientY),
                ),
            shiftKey: ev.shiftKey,
            metaKey: ev.metaKey,
            ctrlKey: ev.ctrlKey,
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

    handleEntityResize(entityId: string, width: number, height: number) {
        const entity = this.canvasStateStore
            .getState()
            .page.entities.get(entityId);
        assert(entity !== undefined, `Entity ${entityId} is not found`);

        entity.onViewResize(this, width, height);
    }
}
