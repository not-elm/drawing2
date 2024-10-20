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
import {
    SelectEntityModeController,
    createSelectEntityMode,
    getSelectedEntityIds,
} from "./SelectEntityModeController";
import { SelectPathModeController } from "./SelectPathModeController";
import { SnapGuideStore } from "./SnapGuideStore";
import { ViewportStore } from "./ViewportStore";

export class App {
    readonly entityConverter = new EntityConverterMap();
    readonly clipboardService = new ClipboardService(this.entityConverter);
    readonly canvasStateStore = new CanvasStateStore(this);
    readonly viewportStore = new ViewportStore();
    readonly gestureRecognizer = new GestureRecognizer(this);
    readonly appStateStore = new AppStateStore();
    readonly historyManager = new HistoryManager(this);
    readonly defaultPropertyStore = new DefaultPropertyStore();
    private readonly modeControllers = new Map<string, ModeController>();
    private readonly entityViewMap = new Map<
        string,
        ComponentType<{ entity: Entity }>
    >();
    private readonly defaultModeController = new SelectEntityModeController();

    // TODO: Move to SelectMode package
    readonly snapGuideStore = new SnapGuideStore();

    constructor() {
        this.addModeController("select-entity", this.defaultModeController);
        this.addModeController("select-path", new SelectPathModeController());
    }

    addModeController(type: string, controller: ModeController): App {
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
    ): App {
        this.entityConverter.register(type, converter);
        return this;
    }

    registerEntityView<E extends Entity>(
        type: string,
        component: ComponentType<{ entity: E }>,
    ): App {
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

    // Edit

    deleteSelectedEntities() {
        const selectedEntityIds = getSelectedEntityIds(
            this.appStateStore.getState().mode,
        );
        if (selectedEntityIds.size === 0) return;

        this.canvasStateStore.edit((draft) => {
            draft.deleteEntities(selectedEntityIds);
        });
    }

    updateProperty(key: string, value: unknown) {
        const selectedEntityIds = getSelectedEntityIds(
            this.appStateStore.getState().mode,
        );
        this.canvasStateStore.edit((draft) => {
            draft.updateProperty([...selectedEntityIds], key, value);
        });
    }

    // Ordering

    bringToFront() {
        const selectedEntityIds = getSelectedEntityIds(
            this.appStateStore.getState().mode,
        );
        if (selectedEntityIds.size === 0) return;

        this.canvasStateStore.edit((draft) =>
            draft.bringToFront(selectedEntityIds),
        );
    }

    bringForward() {
        const selectedEntityIds = getSelectedEntityIds(
            this.appStateStore.getState().mode,
        );
        if (selectedEntityIds.size === 0) return;

        this.canvasStateStore.edit((draft) =>
            draft.bringForward(selectedEntityIds),
        );
    }

    sendBackward() {
        const selectedEntityIds = getSelectedEntityIds(
            this.appStateStore.getState().mode,
        );
        if (selectedEntityIds.size === 0) return;

        this.canvasStateStore.edit((draft) =>
            draft.sendBackward(selectedEntityIds),
        );
    }

    sendToBack() {
        const selectedEntityIds = getSelectedEntityIds(
            this.appStateStore.getState().mode,
        );
        if (selectedEntityIds.size === 0) return;

        this.canvasStateStore.edit((draft) =>
            draft.sendToBack(selectedEntityIds),
        );
    }

    // Selection

    select(entityId: string) {
        const entityIds = new Set(
            getSelectedEntityIds(this.appStateStore.getState().mode),
        );
        entityIds.add(entityId);
        return this.setMode(createSelectEntityMode(entityIds));
    }

    unselect(entityId: string) {
        const entityIds = new Set(
            getSelectedEntityIds(this.appStateStore.getState().mode),
        );
        if (!entityIds.has(entityId)) return;
        entityIds.delete(entityId);
        return this.setMode(createSelectEntityMode(entityIds));
    }

    selectAll() {
        return this.setMode(
            createSelectEntityMode(
                new Set(this.canvasStateStore.getState().entityIds),
            ),
        );
    }

    unselectAll() {
        if (this.appStateStore.getState().mode.type !== "select-entity") return;

        return this.setMode(createSelectEntityMode(new Set()));
    }

    setSelectedEntityIds(entityIds: Iterable<string>) {
        return this.setMode(createSelectEntityMode(new Set(entityIds)));
    }

    // Clipboard

    copy() {
        const selectedEntityIds = getSelectedEntityIds(
            this.appStateStore.getState().mode,
        );
        if (selectedEntityIds.size === 0) return;

        this.clipboardService.copy(
            this.canvasStateStore.getState(),
            selectedEntityIds,
        );
    }

    async cut() {
        this.copy();
        this.deleteSelectedEntities();
    }

    async paste(): Promise<void> {
        const { entities } = await this.clipboardService.paste();

        this.canvasStateStore.edit((draft) => {
            draft.setEntities(entities);
            // draft.addDependencies(dependencies);
        });
        this.setSelectedEntityIds(entities.map((entity) => entity.props.id));

        // Copy pasted entities so that next paste operation will
        // create a new copy of entities in different position
        this.copy();
    }

    // Event handlers

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
                    case "select-entity": {
                        if (modifiers.metaKey || modifiers.ctrlKey) {
                            this.setMode(createSelectEntityMode(new Set()));
                            this.selectAll();
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
                    case "select-entity": {
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
                    case "select-entity": {
                        this.setMode({ type: "new-text" });
                        return true;
                    }
                }
                break;
            }
            case "l": {
                switch (this.appStateStore.getState().mode.type) {
                    case "new-shape":
                    case "select-entity": {
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
                    case "select-entity": {
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
                    case "select-entity": {
                        if (modifiers.metaKey || modifiers.ctrlKey) {
                            this.cut();
                        }
                        return true;
                    }
                }
                break;
            }
            case "c": {
                switch (this.appStateStore.getState().mode.type) {
                    case "select-entity": {
                        if (modifiers.metaKey || modifiers.ctrlKey) {
                            this.copy();
                        }
                        return true;
                    }
                }
                break;
            }
            case "v": {
                switch (this.appStateStore.getState().mode.type) {
                    case "select-entity": {
                        if (modifiers.metaKey || modifiers.ctrlKey) {
                            this.paste();
                        }
                        return true;
                    }
                }
                break;
            }
            case "Escape": {
                switch (this.appStateStore.getState().mode.type) {
                    case "select-entity": {
                        this.unselectAll();
                        return true;
                    }
                    default: {
                        this.setMode(createSelectEntityMode(new Set()));
                        return true;
                    }
                }
            }
            case "Delete":
            case "Backspace": {
                switch (this.appStateStore.getState().mode.type) {
                    case "select-entity": {
                        this.deleteSelectedEntities();
                        return true;
                    }
                }
                break;
            }
        }

        return false;
    }

    handleEntityResize(entityId: string, width: number, height: number) {
        const entity = this.canvasStateStore.getState().entities.get(entityId);
        assert(entity !== undefined, `Entity ${entityId} is not found`);

        entity.onViewResize(this, width, height);
    }
}
