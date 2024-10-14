import { entityHandleMap } from "../../../../instance";
import { isNotNullish } from "../../../../lib/isNullish";
import type { FillMode } from "../../../model/FillMode";
import type { CanvasStateStore } from "../../../store/CanvasStateStore";
import { StatefulViewController } from "../../StatefulViewController";
import { FillModePropertySectionView } from "./FillModePropertySectionView";

export class FillModePropertySection extends StatefulViewController<{
    visible: boolean;
    defaultFillMode: FillMode;
    selectedFillMode: FillMode | null;
}> {
    readonly view = FillModePropertySectionView;

    constructor(private readonly canvasStateStore: CanvasStateStore) {
        super({
            visible: true,
            defaultFillMode: "none",
            selectedFillMode: null,
        });

        this.canvasStateStore.addListener(() => {
            this.update();
        });

        this.update();
    }

    setFillMode(fillMode: FillMode) {
        this.canvasStateStore.edit((tx) => {
            tx.updateProperty(
                this.canvasStateStore.getState().selectedEntityIds,
                PROPERTY_KEY_FILL_MODE,
                fillMode,
            );
        });

        this.setState({ ...this.state, defaultFillMode: fillMode });
    }

    private update() {
        const selectedEntities = this.canvasStateStore
            .getState()
            .getSelectedEntities();
        const fillModes = new Set(
            selectedEntities
                .map((entity) =>
                    entityHandleMap().getProperty(
                        entity,
                        PROPERTY_KEY_FILL_MODE,
                    ),
                )
                .filter(isNotNullish),
        ) as Set<FillMode>;

        this.setState({
            ...this.state,
            visible: fillModes.size > 0,
            selectedFillMode:
                fillModes.size === 0
                    ? this.state.defaultFillMode
                    : fillModes.size === 1
                      ? [...fillModes][0]
                      : null,
        });
    }
}

export const PROPERTY_KEY_FILL_MODE = "fillMode";
