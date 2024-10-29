import type * as csstype from "csstype";
import type { ComponentType } from "react";
import { assert } from "../lib/assert";
import { CanvasStateStore } from "./CanvasStateStore";
import { ClipboardService } from "./ClipboardService";
import { ContextMenuService } from "./ContextMenuService";
import { DefaultPropertyStore } from "./DefaultPropertyStore";
import { type Entity, type EntityHandle, EntityHandleMap } from "./Entity";
import { GestureRecognizer } from "./GestureRecognizer";
import { HistoryManager } from "./HistoryManager";
import type { JSONValue } from "./JSONObject";
import { KeyboardManager } from "./KeyboardManager";
import type { ModeChangeEvent, ModeController } from "./ModeController";
import { MouseEventButton } from "./MouseEventButton";
import { SelectEntityModeController } from "./SelectEntityModeController";
import { SelectPathModeController } from "./SelectPathModeController";
import { SnapGuideStore } from "./SnapGuideStore";
import { ViewportStore } from "./ViewportStore";
import { atom } from "./atom/Atom";
import { Point } from "./shape/Point";

interface AppState {
    readonly mode: string;
    readonly cursor: csstype.Property.Cursor;
    readonly pointerPosition: Point;
}

export class App {
    readonly entityHandle = new EntityHandleMap();

    readonly state = atom<AppState>({
        mode: SelectEntityModeController.MODE_NAME,
        cursor: "default",
        pointerPosition: new Point(0, 0),
    });

    readonly clipboardService = new ClipboardService(this.entityHandle);
    readonly canvasStateStore = new CanvasStateStore(this);
    readonly viewportStore = new ViewportStore();
    readonly gestureRecognizer = new GestureRecognizer(this);
    readonly historyManager = new HistoryManager(this);
    readonly defaultPropertyStore = new DefaultPropertyStore();
    readonly keyboard = new KeyboardManager(this);
    readonly contextMenu = new ContextMenuService(this.viewportStore.state);
    private readonly modeControllers = new Map<string, ModeController>();
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
            this.getModeControllerByType(this.state.get().mode) ??
            this.defaultModeController
        );
    }

    getModeControllerByType(type: string): ModeController | null {
        return this.modeControllers.get(type) ?? null;
    }

    setMode(newMode: string) {
        let aborted = false;
        const ev: ModeChangeEvent = {
            oldMode: this.state.get().mode,
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

        this.state.set({ ...this.state.get(), mode: newMode });
        ev.abort = () => {
            throw new Error("Abort is called after mode change");
        };

        oldModeController.onAfterExitMode(this, ev);

        newModeController.onAfterEnterMode(this, ev);
    }

    registerEntityHandle<E extends Entity>(handle: EntityHandle<E>): App {
        this.entityHandle.set(handle);
        return this;
    }

    getEntityView<E extends Entity>(entity: E): ComponentType<{ entity: E }> {
        return this.entityHandle.getHandle(entity).getView();
    }

    // Edit

    deleteSelectedEntities() {
        const selectedEntityIds = this.canvasStateStore.selectedEntityIds.get();
        if (selectedEntityIds.size === 0) return;

        this.canvasStateStore.edit((draft) => {
            draft.deleteEntities(selectedEntityIds);
        });
    }

    updatePropertyForSelectedEntities(key: string, value: JSONValue) {
        const selectedEntityIds = this.canvasStateStore.selectedEntityIds.get();
        if (selectedEntityIds.size === 0) {
            return;
        }
        this.canvasStateStore.edit((draft) => {
            draft.updateProperty([...selectedEntityIds], key, value);
        });
    }

    // Ordering

    bringToFront() {
        const selectedEntityIds = this.canvasStateStore.selectedEntityIds.get();
        if (selectedEntityIds.size === 0) return;

        this.canvasStateStore.edit((draft) =>
            draft.bringToFront(selectedEntityIds),
        );
    }

    bringForward() {
        const selectedEntityIds = this.canvasStateStore.selectedEntityIds.get();
        if (selectedEntityIds.size === 0) return;

        this.canvasStateStore.edit((draft) =>
            draft.bringForward(selectedEntityIds),
        );
    }

    sendBackward() {
        const selectedEntityIds = this.canvasStateStore.selectedEntityIds.get();
        if (selectedEntityIds.size === 0) return;

        this.canvasStateStore.edit((draft) =>
            draft.sendBackward(selectedEntityIds),
        );
    }

    sendToBack() {
        const selectedEntityIds = this.canvasStateStore.selectedEntityIds.get();
        if (selectedEntityIds.size === 0) return;

        this.canvasStateStore.edit((draft) =>
            draft.sendToBack(selectedEntityIds),
        );
    }

    // Clipboard

    copy() {
        const selectedEntityIds = this.canvasStateStore.selectedEntityIds.get();
        if (selectedEntityIds.size === 0) return;

        this.clipboardService.copy(
            this.canvasStateStore.page.get(),
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
            entities.map((entity) => entity.id),
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
        if (this.contextMenu.state.get().visible) {
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
            point: this.viewportStore.state
                .get()
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
            point: this.viewportStore.state
                .get()
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
        if (this.contextMenu.state.get().visible) return;

        this.gestureRecognizer.handlePointerMove(ev);

        const point = this.viewportStore.state
            .get()
            .fromCanvasCoordinateTransform.apply(
                new Point(ev.clientX, ev.clientY),
            );
        this.state.set({ ...this.state.get(), pointerPosition: point });
        this.getModeController().getCursor(this);
    }

    /**
     * Handle native `pointerup` events
     * @internal
     */
    handlePointerUp(ev: PointerEvent) {
        if (this.contextMenu.state.get().visible) return;
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
        if (this.contextMenu.state.get().visible) return;
        if (this.requiredPointerUpCountBeforeDoubleClick > 0) return;

        this.getModeController().onCanvasDoubleClick(this, {
            pointerId: -1,
            button: "main",
            point: this.viewportStore.state
                .get()
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
        if (this.contextMenu.state.get().visible) return;

        this.viewportStore.movePosition(deltaCanvasX, deltaCanvasY);
    }

    handleScale(
        newScale: number,
        centerCanvasX: number,
        centerCanvasY: number,
    ) {
        if (this.contextMenu.state.get().visible) return;

        this.viewportStore.setScale(newScale, centerCanvasX, centerCanvasY);
    }

    /**
     * Handle native `keydown` events
     * @internal
     */
    handleKeyDown(ev: KeyboardEvent) {
        if (this.contextMenu.state.get().visible) return;

        this.keyboard.handleKeyDown(ev);
    }

    handleEntityResize(entityId: string, width: number, height: number) {
        const entity = this.canvasStateStore.page.get().entities.get(entityId);
        assert(entity !== undefined, `Entity ${entityId} is not found`);

        this.entityHandle
            .getHandle(entity)
            .onViewResize(entity, this, width, height);
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
