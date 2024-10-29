import type { Viewport } from "./Viewport";
import { type ICell, cell } from "./cell/ICell";
import { Point } from "./shape/Point";

export interface ContextMenuItem {
    title: string;
    action: () => void;

    // TODO: メニュー項目が表示されるコンテキストの条件を指定する方法
    // e.g. キャンバスを右クリックしたときは表示されず、エンティティを
    // 右クリックした場合のみ表示されるメニュー、など。
}

export interface ContextMenuState {
    items: ContextMenuItem[];
    visible: boolean;

    /**
     * Position to show the context menu (in canvas coordinate).
     */
    positionInCanvas: Point;
}

export class ContextMenuService {
    static CONTEXT_MENU_POSITION_MARGIN = 32;

    readonly state = cell<ContextMenuState>({
        items: [],
        visible: false,
        positionInCanvas: new Point(0, 0),
    });

    constructor(private readonly viewport: ICell<Viewport>) {}

    /**
     * Add menu item to the context menu
     * @param item Menu item to add.
     */
    add(item: ContextMenuItem) {
        this.state.set({
            ...this.state.get(),
            items: [...this.state.get().items, item],
        });
    }

    /**
     * Show context menu at the specified position.
     * @param positionInCanvas Position to show the context menu (in canvas coordinate).
     */
    show(positionInCanvas: Point) {
        this.state.set({
            ...this.state.get(),
            visible: true,
            positionInCanvas,
        });
    }

    /**
     * Hide context menu.
     */
    hide() {
        this.state.set({
            ...this.state.get(),
            visible: false,
        });
    }

    /**
     *  Called when menu view is resized by browser's layout engine.
     */
    onMenuResize(width: number, height: number) {
        const viewportRect = this.viewport.get().rect;
        const x = Math.max(
            ContextMenuService.CONTEXT_MENU_POSITION_MARGIN,
            Math.min(
                this.state.get().positionInCanvas.x,
                viewportRect.width -
                    width -
                    ContextMenuService.CONTEXT_MENU_POSITION_MARGIN,
            ),
        );
        const y = Math.max(
            ContextMenuService.CONTEXT_MENU_POSITION_MARGIN,
            Math.min(
                this.state.get().positionInCanvas.y,
                viewportRect.height -
                    height -
                    ContextMenuService.CONTEXT_MENU_POSITION_MARGIN,
            ),
        );

        this.state.set({
            ...this.state.get(),
            positionInCanvas: new Point(x, y),
        });
    }
}
