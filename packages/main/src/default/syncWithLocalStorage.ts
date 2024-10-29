import type { App } from "../core/App";
import { Page, type SerializedPage } from "../core/Page";

const DEBOUNCE_INTERVAL_IN_MS = 1000;

export function syncWithLocalStorage(app: App) {
    let debounceTimerId: ReturnType<typeof setTimeout> | null = null;

    app.canvasStateStore.page.addListener(() => {
        if (debounceTimerId !== null) {
            clearTimeout(debounceTimerId);
            debounceTimerId = null;
        }

        debounceTimerId = setTimeout(() => {
            const serializedPage = app.canvasStateStore.page.get().serialize();
            localStorage.setItem(
                LOCAL_STORAGE_KEY,
                JSON.stringify(serializedPage),
            );
        }, DEBOUNCE_INTERVAL_IN_MS);
    });

    const page = loadFromLocalStorage();

    if (page !== null) {
        app.canvasStateStore.setPage(page);
        app.canvasStateStore.unselectAll();
    }
}

function loadFromLocalStorage(): Page | null {
    try {
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (data === null) return null;

        const serializedPage: SerializedPage = JSON.parse(data);
        const page = Page.deserialize(serializedPage);

        return page;
    } catch (e) {
        console.error(e);
        return null;
    }
}
const LOCAL_STORAGE_KEY = "LocalCanvasStateStore.state.page";
