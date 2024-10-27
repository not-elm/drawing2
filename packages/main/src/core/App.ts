import type { ComponentType } from "react";
import { assert } from "../lib/assert";
import { AppStateStore } from "./AppStateStore";
import { CanvasStateStore } from "./CanvasStateStore";
import { ClipboardService } from "./ClipboardService";
import { ContextMenuService } from "./ContextMenuService";
import { DefaultPropertyStore } from "./DefaultPropertyStore";
import type { Entity } from "./Entity";
import { type EntityConverter, EntityConverterMap } from "./EntityConverter";
import { GestureRecognizer } from "./GestureRecognizer";
import { HistoryManager } from "./HistoryManager";
import { KeyboardManager } from "./KeyboardManager";
import type { ModeChangeEvent, ModeController } from "./ModeController";
import { MouseEventButton } from "./MouseEventButton";
import { SelectEntityModeController } from "./SelectEntityModeController";
import { SelectPathModeController } from "./SelectPathModeController";
import { SnapGuideStore } from "./SnapGuideStore";
import { ViewportStore } from "./ViewportStore";
import { Point } from "./shape/Point";

export class App {
    readonly appStateStore = new AppStateStore();

    readonly entityConverter = new EntityConverterMap();
    readonly clipboardService = new ClipboardService(this.entityConverter);
    readonly canvasStateStore = new CanvasStateStore(this);
    readonly viewportStore = new ViewportStore();
    readonly gestureRecognizer = new GestureRecognizer(this);
    readonly historyManager = new HistoryManager(this);
    readonly defaultPropertyStore = new DefaultPropertyStore();
    readonly keyboard = new KeyboardManager(this);
    readonly contextMenu = new ContextMenuService(this.viewportStore);
    private readonly modeControllers = new Map<string, ModeController>();
    private readonly entityViewMap = new Map<
        string,
        ComponentType<{ entity: Entity }>
    >();
    private readonly defaultModeController = new SelectEntityModeController();

    // TODO: Move to SelectMode package
    readonly snapGuideStore = new SnapGuideStore();

    private requiredPointerUpCountBeforeDoubleClick = 0;

    constructor() {
        this.addModeController(
            SelectEntityModeController.MODE_NAME,
            this.defaultModeController,
        );
        this.addModeController(
            SelectPathModeController.MODE_NAME,
            new SelectPathModeController(),
        );

        this.keyboard.addBinding({
            key: "z",
            metaKey: true,
            shiftKey: false,
            action: () => this.historyManager.undo(),
        });
        this.keyboard.addBinding({
            key: "z",
            metaKey: true,
            shiftKey: true,
            action: () => this.historyManager.redo(),
        });
        this.keyboard.addBinding({
            key: "x",
            metaKey: true,
            action: () => this.cut(),
        });
        this.keyboard.addBinding({
            key: "c",
            metaKey: true,
            action: () => this.copy(),
        });
        this.keyboard.addBinding({
            key: "v",
            metaKey: true,
            action: () => this.paste(),
        });

        this.keyboard.addBinding({
            key: "z",
            ctrlKey: true,
            shiftKey: false,
            action: () => this.historyManager.undo(),
        });
        this.keyboard.addBinding({
            key: "z",
            ctrlKey: true,
            shiftKey: true,
            action: () => this.historyManager.redo(),
        });
        this.keyboard.addBinding({
            key: "x",
            ctrlKey: true,
            action: () => this.cut(),
        });
        this.keyboard.addBinding({
            key: "c",
            ctrlKey: true,
            action: () => this.copy(),
        });
        this.keyboard.addBinding({
            key: "v",
            ctrlKey: true,
            action: () => this.paste(),
        });
    }

    addModeController(type: string, controller: ModeController): App {
        assert(
            !this.modeControllers.has(type),
            `Mode ${type} is already registered`,
        );
        this.modeControllers.set(type, controller);
        controller.onRegistered(this);
        return this;
    }

    getModeController(): ModeController {
        return (
            this.getModeControllerByType(this.appStateStore.getState().mode) ??
            this.defaultModeController
        );
    }

    getModeControllerByType(type: string): ModeController | null {
        return this.modeControllers.get(type) ?? null;
    }

    setMode(newMode: string) {
        let aborted = false;
        const ev: ModeChangeEvent = {
            oldMode: this.appStateStore.getState().mode,
            newMode,
            abort: () => {
                aborted = true;
            },
        };

        const oldModeController = this.getModeController();
        const newModeController = this.getModeControllerByType(newMode);
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
        const selectedEntityIds =
            this.canvasStateStore.getState().selectedEntityIds;
        if (selectedEntityIds.size === 0) return;

        this.canvasStateStore.edit((draft) => {
            draft.deleteEntities(selectedEntityIds);
        });
    }

    updatePropertyForSelectedEntities(key: string, value: unknown) {
        const selectedEntityIds =
            this.canvasStateStore.getState().selectedEntityIds;
        if (selectedEntityIds.size === 0) {
            return;
        }
        this.canvasStateStore.edit((draft) => {
            draft.updateProperty([...selectedEntityIds], key, value);
        });
    }

    // Ordering

    bringToFront() {
        const selectedEntityIds =
            this.canvasStateStore.getState().selectedEntityIds;
        if (selectedEntityIds.size === 0) return;

        this.canvasStateStore.edit((draft) =>
            draft.bringToFront(selectedEntityIds),
        );
    }

    bringForward() {
        const selectedEntityIds =
            this.canvasStateStore.getState().selectedEntityIds;
        if (selectedEntityIds.size === 0) return;

        this.canvasStateStore.edit((draft) =>
            draft.bringForward(selectedEntityIds),
        );
    }

    sendBackward() {
        const selectedEntityIds =
            this.canvasStateStore.getState().selectedEntityIds;
        if (selectedEntityIds.size === 0) return;

        this.canvasStateStore.edit((draft) =>
            draft.sendBackward(selectedEntityIds),
        );
    }

    sendToBack() {
        const selectedEntityIds =
            this.canvasStateStore.getState().selectedEntityIds;
        if (selectedEntityIds.size === 0) return;

        this.canvasStateStore.edit((draft) =>
            draft.sendToBack(selectedEntityIds),
        );
    }

    // Clipboard

    copy() {
        const selectedEntityIds =
            this.canvasStateStore.getState().selectedEntityIds;
        if (selectedEntityIds.size === 0) return;

        this.clipboardService.copy(
            this.canvasStateStore.getState().page,
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
        this.canvasStateStore.setSelectedEntityIds(
            entities.map((entity) => entity.props.id),
        );

        // Copy pasted entities so that next paste operation will
        // create a new copy of entities in different position
        this.copy();
    }

    // Event handlers

    /**
     * Handle native `pointerdown` events
     * @internal
     */
    handlePointerDown(ev: PointerEvent) {
        if (this.contextMenu.getState().visible) {
            this.contextMenu.hide();
            this.resetRequiredPointerUpCountBeforeDoubleClick();
            ev.preventDefault();
            return;
        }

        // Ignore if not main button since we don't need to handle
        // drag operation with other buttons
        if (ev.button !== MouseEventButton.MAIN) return;

        this.gestureRecognizer.handlePointerDown(ev);

        this.getModeController().onCanvasPointerDown(this, {
            pointerId: ev.pointerId,
            button: ev.button === MouseEventButton.MAIN ? "main" : "other",
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

    handleContextMenu(ev: MouseEvent) {
        ev.preventDefault();

        if (this.gestureRecognizer.inPointerEventSession()) return;

        this.getModeController().onContextMenu(this, {
            pointerId: -1,
            button: "other",
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

    /**
     * Handle native `pointermove` events
     * @internal
     */
    handlePointerMove(ev: PointerEvent) {
        if (this.contextMenu.getState().visible) return;

        this.gestureRecognizer.handlePointerMove(ev);

        const point = this.viewportStore
            .getState()
            .fromCanvasCoordinateTransform.apply(
                new Point(ev.clientX, ev.clientY),
            );
        this.appStateStore.setPointerPosition(point);
        this.getModeController().getCursor(this);
    }

    /**
     * Handle native `pointerup` events
     * @internal
     */
    handlePointerUp(ev: PointerEvent) {
        if (this.contextMenu.getState().visible) return;
        if (this.requiredPointerUpCountBeforeDoubleClick > 0) {
            this.requiredPointerUpCountBeforeDoubleClick -= 1;
        }

        this.gestureRecognizer.handlePointerUp(ev);
    }

    /**
     * Handle native `doubleclick` events
     * @internal
     */
    handleDoubleClick(ev: MouseEvent) {
        if (this.contextMenu.getState().visible) return;
        if (this.requiredPointerUpCountBeforeDoubleClick > 0) return;

        this.getModeController().onCanvasDoubleClick(this, {
            pointerId: -1,
            button: "main",
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
        if (this.contextMenu.getState().visible) return;

        this.viewportStore.movePosition(deltaCanvasX, deltaCanvasY);
    }

    handleScale(
        newScale: number,
        centerCanvasX: number,
        centerCanvasY: number,
    ) {
        if (this.contextMenu.getState().visible) return;

        this.viewportStore.setScale(newScale, centerCanvasX, centerCanvasY);
    }

    /**
     * Handle native `keydown` events
     * @internal
     */
    handleKeyDown(ev: KeyboardEvent) {
        if (this.contextMenu.getState().visible) return;

        this.keyboard.handleKeyDown(ev);
    }

    handleEntityResize(entityId: string, width: number, height: number) {
        const entity = this.canvasStateStore
            .getState()
            .page.entities.get(entityId);
        assert(entity !== undefined, `Entity ${entityId} is not found`);

        entity.onViewResize(this, width, height);
    }

    /**
     * This application handles pointer event sequences mainly, but native "dblclick" events
     * cannot be prevented from pointer events. This causes unintended user experience when
     * pointer sequence starts with closing the context menu.
     *
     * - pointerdown : context menu is closed here
     * - pointerup
     * - pointerdown : In user's intention, this is the first click of double click on canvas.
     * - pointerup
     * - dblclick    : Double click event is fired after "the first click"
     * - pointerdown
     * - pointerup
     * - dblclick    : This is the double click event user expected
     *
     * To prevent this, we need to ignore dblclick event until pointerup event is fired
     * at-least 3 times.
     *
     * @private
     */
    private resetRequiredPointerUpCountBeforeDoubleClick() {
        this.requiredPointerUpCountBeforeDoubleClick = 3;
    }
}
