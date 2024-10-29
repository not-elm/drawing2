import type { App } from "./App";
import type { Page } from "./Page";

const MAX_HISTORY_LENGTH = 1000;

interface HistoryEntry {
    page: Page;
    selectedEntityIds: ReadonlySet<string>;
    mode: string;
}

export class HistoryManager {
    private readonly undoStack: HistoryEntry[] = [];
    private currentState: HistoryEntry;
    private readonly redoStack: HistoryEntry[] = [];

    /**
     * If true, the history manager will not record any changes to the history stack.
     */
    private paused = false;

    /**
     * If true, the history manager is currently in the process of undoing/redoing a change.
     */
    private processing = false;

    constructor(private readonly app: App) {
        this.app.canvas.page.addListener(this.handleCanvasStateStoreChange);
        this.currentState = {
            page: app.canvas.page.get(),
            selectedEntityIds: app.canvas.selectedEntityIds.get(),
            mode: app.mode.get(),
        };
    }

    pause() {
        if (this.paused) return;
        this.paused = true;

        // Current state won't be saved since history manager is going to be paused.
        // So we need to save it beforehand
        this.undoStack.push(this.currentState);
    }

    resume() {
        if (!this.paused) return;
        this.paused = false;

        // No change happened while paused. The state we stored beforehand in pause()
        // is not needed actually
        if (this.undoStack[this.undoStack.length - 1] === this.currentState) {
            this.undoStack.pop();
        }
    }

    private handleCanvasStateStoreChange = () => {
        const lastState = this.currentState;
        this.currentState = {
            page: this.app.canvas.page.get(),
            selectedEntityIds: this.app.canvas.selectedEntityIds.get(),
            mode: this.app.mode.get(),
        };

        if (this.paused) {
            return;
        }
        if (this.processing) {
            return;
        }

        this.redoStack.length = 0;
        this.undoStack.push(lastState);
        while (this.undoStack.length > MAX_HISTORY_LENGTH) {
            this.undoStack.shift();
        }
    };

    undo() {
        if (this.paused) {
            console.warn("Undoing is requested while paused");
            this.resume();
        }

        const prevState = this.undoStack.pop();
        if (prevState === undefined) return;

        this.redoStack.push(this.currentState);
        while (this.redoStack.length > MAX_HISTORY_LENGTH) {
            this.redoStack.shift();
        }

        this.currentState = prevState;

        this.processing = true;
        try {
            this.app.canvas.setPage(prevState.page);
            this.app.canvas.setSelectedEntityIds(prevState.selectedEntityIds);
            this.app.setMode(prevState.mode);
        } catch (e) {
            console.error(e);
        } finally {
            this.processing = false;
        }
    }

    redo() {
        if (this.paused) {
            console.warn("Redoing is requested while paused");
            this.resume();
        }

        const nestState = this.redoStack.pop();
        if (nestState === undefined) return;

        this.undoStack.push(this.currentState);
        while (this.undoStack.length > MAX_HISTORY_LENGTH) {
            this.undoStack.shift();
        }
        this.currentState = nestState;

        this.processing = true;
        try {
            this.app.canvas.setPage(nestState.page);
            this.app.canvas.setSelectedEntityIds(nestState.selectedEntityIds);
            this.app.setMode(nestState.mode);
        } finally {
            this.processing = false;
        }
    }
}
