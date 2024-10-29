import type * as csstype from "csstype";
import type { ComponentType } from "react";
import type { JSONValue } from "../lib/JSONObject";
import { assert } from "../lib/assert";
import { CanvasStateStore } from "./CanvasStateStore";
import { ClipboardService } from "./ClipboardService";
import { ContextMenuService } from "./ContextMenuService";
import { type Entity, type EntityHandle, EntityHandleMap } from "./Entity";
import { GestureRecognizer, MouseEventButton } from "./GestureRecognizer";
import { HistoryManager } from "./HistoryManager";
import { KeyboardManager } from "./KeyboardManager";
import type { ModeChangeEvent, ModeController } from "./ModeController";
import { SelectEntityModeController } from "./SelectEntityModeController";
import { SelectPathModeController } from "./SelectPathModeController";
import type { SnapGuide } from "./SnapEntry";
import { SnapGuideMap } from "./SnapGuideMap";
import { Viewport } from "./Viewport";
import { cell } from "./cell/ICell";
import { Point } from "./shape/Point";
import { Rect } from "./shape/Shape";

class SelectedProperties {
    constructor(private properties: Record<string, unknown>) {}

    set(key: string, value: unknown): SelectedProperties {
        return new SelectedProperties({ ...this.properties, [key]: value });
    }

    getOrDefault<T>(key: string, defaultValue: T): T {
        return key in this.properties
            ? (this.properties[key] as T)
            : defaultValue;
    }
}

export class App {
    readonly entityHandle = new EntityHandleMap();

    readonly mode = cell(SelectEntityModeController.type);
    readonly cursor = cell<csstype.Property.Cursor>("default");
    readonly pointerPosition = cell(new Point(0, 0));
    readonly viewport = cell(new Viewport(Rect.of(0, 0, 1, 1), 1));
    readonly selectedProperties = cell(new SelectedProperties({}));
    readonly snapGuideMap = cell(new SnapGuideMap());
    readonly modeControllers = cell(new Map<string, ModeController>());

    readonly clipboard = new ClipboardService(this.entityHandle);
    readonly canvas = new CanvasStateStore(this);
    readonly gesture = new GestureRecognizer(this);
    readonly history = new HistoryManager(this);
    readonly keyboard = new KeyboardManager(this);
    readonly contextMenu = new ContextMenuService(this.viewport);

    private readonly defaultModeController = new SelectEntityModeController(
        this,
    );

    private requiredPointerUpCountBeforeDoubleClick = 0;

    constructor() {
        this.addModeController(
            SelectEntityModeController.type,
            this.defaultModeController,
        );
        this.addModeController(
            SelectPathModeController.type,
            new SelectPathModeController(),
        );

        this.keyboard.addBinding({
            key: "z",
            metaKey: true,
            shiftKey: false,
            action: () => this.history.undo(),
        });
        this.keyboard.addBinding({
            key: "z",
            metaKey: true,
            shiftKey: true,
            action: () => this.history.redo(),
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
            action: () => this.history.undo(),
        });
        this.keyboard.addBinding({
            key: "z",
            ctrlKey: true,
            shiftKey: true,
            action: () => this.history.redo(),
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
        const modeControllers = this.modeControllers.get();
        assert(
            !modeControllers.has(type),
            `Mode ${type} is already registered`,
        );
        const newModeControllers = new Map(modeControllers);
        newModeControllers.set(type, controller);
        this.modeControllers.set(newModeControllers);
        controller.onRegistered(this);
        return this;
    }

    getModeController(): ModeController {
        return (
            this.getModeControllerByType(this.mode.get()) ??
            this.defaultModeController
        );
    }

    getModeControllerByClass<T extends ModeController>(cls: {
        type: string;
        new (...args: never[]): T;
    }): T {
        const controller = this.getModeControllerByType(cls.type);
        assert(controller !== undefined, `Mode ${cls.type} is not found`);

        return controller as T;
    }

    getModeControllerByType(type: string): ModeController | null {
        return this.modeControllers.get().get(type) ?? null;
    }

    setMode(newMode: string) {
        let aborted = false;
        const ev: ModeChangeEvent = {
            oldMode: this.mode.get(),
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

        this.mode.set(newMode);
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
        const selectedEntityIds = this.canvas.selectedEntityIds.get();
        if (selectedEntityIds.size === 0) return;

        this.canvas.edit((draft) => {
            draft.deleteEntities(selectedEntityIds);
        });
    }

    updatePropertyForSelectedEntities(key: string, value: JSONValue) {
        const selectedEntityIds = this.canvas.selectedEntityIds.get();
        if (selectedEntityIds.size === 0) {
            return;
        }
        this.canvas.edit((draft) => {
            draft.updateProperty([...selectedEntityIds], key, value);
        });
    }

    getSelectedPropertyValue<T>(key: string, defaultValue: T): T {
        return this.selectedProperties.get().getOrDefault(key, defaultValue);
    }

    setSelectedPropertyValue<T>(key: string, value: T) {
        this.selectedProperties.set(
            this.selectedProperties.get().set(key, value),
        );
    }

    setSnapGuide(key: string, guide: SnapGuide) {
        this.snapGuideMap.set(this.snapGuideMap.get().setSnapGuide(key, guide));
    }

    deleteSnapGuide(key: string) {
        this.snapGuideMap.set(this.snapGuideMap.get().deleteSnapGuide(key));
    }

    // Ordering

    bringToFront() {
        const selectedEntityIds = this.canvas.selectedEntityIds.get();
        if (selectedEntityIds.size === 0) return;

        this.canvas.edit((draft) => draft.bringToFront(selectedEntityIds));
    }

    bringForward() {
        const selectedEntityIds = this.canvas.selectedEntityIds.get();
        if (selectedEntityIds.size === 0) return;

        this.canvas.edit((draft) => draft.bringForward(selectedEntityIds));
    }

    sendBackward() {
        const selectedEntityIds = this.canvas.selectedEntityIds.get();
        if (selectedEntityIds.size === 0) return;

        this.canvas.edit((draft) => draft.sendBackward(selectedEntityIds));
    }

    sendToBack() {
        const selectedEntityIds = this.canvas.selectedEntityIds.get();
        if (selectedEntityIds.size === 0) return;

        this.canvas.edit((draft) => draft.sendToBack(selectedEntityIds));
    }

    // Clipboard

    copy() {
        const selectedEntityIds = this.canvas.selectedEntityIds.get();
        if (selectedEntityIds.size === 0) return;

        this.clipboard.copy(this.canvas.page.get(), selectedEntityIds);
    }

    async cut() {
        this.copy();
        this.deleteSelectedEntities();
    }

    async paste(): Promise<void> {
        const { entities } = await this.clipboard.paste();

        this.canvas.edit((draft) => {
            draft.setEntities(entities);
            // draft.addDependencies(dependencies);
        });
        this.canvas.setSelectedEntityIds(entities.map((entity) => entity.id));

        // Copy pasted entities so that next paste operation will
        // create a new copy of entities in different position
        this.copy();
    }

    // Viewport

    moveViewport(deltaCanvasX: number, deltaCanvasY: number) {
        this.viewport.set(this.viewport.get().move(deltaCanvasX, deltaCanvasY));
    }

    scaleViewport(
        newScale: number,
        centerCanvasX: number,
        centerCanvasY: number,
    ) {
        this.viewport.set(
            this.viewport
                .get()
                .setScale(newScale, centerCanvasX, centerCanvasY),
        );
    }

    resizeViewport(canvasWidth: number, canvasHeight: number) {
        this.viewport.set(
            this.viewport.get().resize(canvasWidth, canvasHeight),
        );
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

        this.gesture.handlePointerDown(ev);

        this.getModeController().onCanvasPointerDown(this, {
            pointerId: ev.pointerId,
            button: ev.button === MouseEventButton.MAIN ? "main" : "other",
            point: this.viewport
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

        if (this.gesture.inPointerEventSession()) return;

        this.getModeController().onContextMenu(this, {
            pointerId: -1,
            button: "other",
            point: this.viewport
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

        this.gesture.handlePointerMove(ev);

        const point = this.viewport
            .get()
            .fromCanvasCoordinateTransform.apply(
                new Point(ev.clientX, ev.clientY),
            );
        this.pointerPosition.set(point);
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

        this.gesture.handlePointerUp(ev);
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
            point: this.viewport
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

        this.moveViewport(deltaCanvasX, deltaCanvasY);
    }

    handleScale(
        newScale: number,
        centerCanvasX: number,
        centerCanvasY: number,
    ) {
        if (this.contextMenu.state.get().visible) return;

        this.scaleViewport(newScale, centerCanvasX, centerCanvasY);
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
        const entity = this.canvas.page.get().entities.get(entityId);
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
