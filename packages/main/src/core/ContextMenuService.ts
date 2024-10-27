import { type StateProvider, Store } from "../lib/Store";
import type { ViewportStore } from "./ViewportStore";
import { Point } from "./geo/Point";

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

export class ContextMenuService extends Store<ContextMenuState> {
    static CONTEXT_MENU_POSITION_MARGIN = 32;

    constructor(
        private readonly viewportStateProvider: StateProvider<ViewportStore>,
    ) {
        super({
            items: [],
            visible: false,
            positionInCanvas: new Point(0, 0),
        });
    }

    /**
     * Add menu item to the context menu
     * @param item Menu item to add.
     */
    add(item: ContextMenuItem) {
        this.setState({
            ...this.state,
            items: [...this.state.items, item],
        });
    }

    /**
     * Show context menu at the specified position.
     * @param positionInCanvas Position to show the context menu (in canvas coordinate).
     */
    show(positionInCanvas: Point) {
        this.setState({
            ...this.state,
            visible: true,
            positionInCanvas,
        });
    }

    /**
     * Hide context menu.
     */
    hide() {
        this.setState({
            ...this.state,
            visible: false,
        });
    }

    /**
     *  Called when menu view is resized by browser's layout engine.
     */
    onMenuResize(width: number, height: number) {
        const viewportRect = this.viewportStateProvider.getState().rect;
        const x = Math.max(
            ContextMenuService.CONTEXT_MENU_POSITION_MARGIN,
            Math.min(
                this.state.positionInCanvas.x,
                viewportRect.width -
                    width -
                    ContextMenuService.CONTEXT_MENU_POSITION_MARGIN,
            ),
        );
        const y = Math.max(
            ContextMenuService.CONTEXT_MENU_POSITION_MARGIN,
            Math.min(
                this.state.positionInCanvas.y,
                viewportRect.height -
                    height -
                    ContextMenuService.CONTEXT_MENU_POSITION_MARGIN,
            ),
        );

        this.setState({
            ...this.state,
            positionInCanvas: new Point(x, y),
        });
    }
}
