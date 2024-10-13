import type { CanvasState } from "./model/CanvasState";
import type { CanvasStateStore } from "./store/CanvasStateStore";

const MAX_HISTORY_LENGTH = 1000;

export class HistoryManager {
    private readonly undoStack: CanvasState[] = [];
    private currentState: CanvasState;
    private readonly redoStack: CanvasState[] = [];

    /**
     * If true, the history manager will not record any changes to the history stack.
     */
    private paused = false;

    /**
     * If true, the history manager is currently in the process of undoing/redoing a change.
     */
    private processing = false;

    constructor(private readonly canvasStateStore: CanvasStateStore) {
        this.canvasStateStore.addListener(this.handleCanvasStateStoreChange);
        this.currentState = canvasStateStore.getState();
    }

    pause() {
        this.paused = true;

        // Current state won't be saved since history manager is going to be paused.
        // So we need to save it beforehand
        this.undoStack.push(this.currentState);
    }

    resume() {
        this.paused = false;

        // No change happened while paused. The state we stored beforehand in pause()
        // is not needed actually
        if (this.undoStack[this.undoStack.length - 1] === this.currentState) {
            this.undoStack.pop();
        }
    }

    private handleCanvasStateStoreChange = (state: CanvasState) => {
        const lastState = this.currentState;
        this.currentState = state;

        if (lastState.page === state.page) {
            return;
        }
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
            this.canvasStateStore.setPage(prevState.page);
            this.canvasStateStore.setSelectedEntityIds([
                ...prevState.selectedEntityIds,
            ]);
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

        const nextPage = this.redoStack.pop();
        if (nextPage === undefined) return;

        this.undoStack.push(this.currentState);
        while (this.undoStack.length > MAX_HISTORY_LENGTH) {
            this.undoStack.shift();
        }
        this.currentState = nextPage;

        this.processing = true;
        try {
            this.canvasStateStore.setPage(nextPage.page);
            this.canvasStateStore.setSelectedEntityIds([
                ...nextPage.selectedEntityIds,
            ]);
        } finally {
            this.processing = false;
        }
    }
}
