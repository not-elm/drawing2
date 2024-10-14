import { isPathEntity } from "../../entity/PathEntity/PathEntity";
import { isTextEntity } from "../../entity/TextEntity/TextEntity";
import { Store } from "../../lib/Store";
import type { TextEntitySizingMode } from "../model/TextEntitySizingMode";
import type { AppStateStore } from "./AppStateStore";
import type { CanvasStateStore } from "./CanvasStateStore";

interface PropertyPanelState {
    readonly lineEndTypeSectionVisible: boolean;

    readonly textEntitySizingModeSectionVisible: boolean;
    readonly textEntitySizingMode: TextEntitySizingMode | null;
}

export class PropertyPanelStateStore extends Store<PropertyPanelState> {
    constructor(
        private readonly canvasStateStore: CanvasStateStore,
        private readonly appStateStore: AppStateStore,
    ) {
        super({
            lineEndTypeSectionVisible: true,
            textEntitySizingModeSectionVisible: true,
            textEntitySizingMode: null,
        });

        this.canvasStateStore.addListener(() => this.update());
        this.appStateStore.addListener(() => this.update());
        this.update();
    }

    addListener(callback: (state: PropertyPanelState) => void) {
        super.addListener(callback);
    }

    private update() {
        const appState = this.appStateStore.getState();
        const canvasState = this.canvasStateStore.getState();

        const selectedEntities = canvasState.getSelectedEntities();
        const selectedPaths = selectedEntities.filter(isPathEntity);
        const selectedTexts = selectedEntities.filter(isTextEntity);

        const textEntitySizingModes = new Set(
            selectedTexts.map((text) => text.sizingMode),
        );

        this.setState({
            lineEndTypeSectionVisible:
                selectedPaths.length > 0 || appState.mode.type === "new-path",
            textEntitySizingModeSectionVisible:
                selectedTexts.length > 0 ||
                appState.mode.type === "new-text" ||
                appState.mode.type === "edit-text",
            textEntitySizingMode:
                textEntitySizingModes.size === 0
                    ? appState.defaultTextEntitySizingMode
                    : textEntitySizingModes.size === 1
                      ? [...textEntitySizingModes][0]
                      : null,
        });
    }
}
