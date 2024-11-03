import type { App } from "./App";
import type { Page } from "./Page";

interface HistoryEntry {
    page: Page;
}

/**
 * 与えられたデータストアについて
 * - すべての変更を監視し、変更内容を記録する
 * - addCheckpoint()で、現在の状態を記録し、undoで戻れるようにする
 *     - 新しい変更を加える直前に呼び出す
 * - undo()でcheckpointまでもどる
 *     - 最後のcheckpointから現在の状態までに変更がない場合そのcheckpointを無視してさらにundoする
 */
export class HistoryManager {
    private readonly undoStack: HistoryEntry[] = [];
    private readonly redoStack: HistoryEntry[] = [];

    constructor(private readonly app: App) {
        this.undoStack.push({ page: this.app.canvas.page.get() });
    }

    addCheckpoint() {
        this.undoStack.push({ page: this.app.canvas.page.get() });
        this.redoStack.length = 0;
    }

    undo() {
        const entry = this.undoStack.pop();
        if (entry === undefined) return;
        this.redoStack.push({
            page: this.app.canvas.page.get(),
        });
        this.app.canvas.setPage(entry.page);
    }

    redo() {
        const entry = this.redoStack.pop();
        if (entry === undefined) return;
        this.undoStack.push({
            page: this.app.canvas.page.get(),
        });
        this.app.canvas.setPage(entry.page);
    }

    clear() {
        this.undoStack.length = 0;
        this.redoStack.length = 0;
        this.addCheckpoint();
    }
}
