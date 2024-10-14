import { entityHandleMap } from "../../../../instance";
import { isNotNullish } from "../../../../lib/isNullish";
import type { StrokeStyle } from "../../../model/StrokeStyle";
import type { CanvasStateStore } from "../../../store/CanvasStateStore";
import { StatefulViewController } from "../../StatefulViewController";
import { StrokeStylePropertySectionView } from "./StrokeStylePropertySectionView";

export class StrokeStylePropertySection extends StatefulViewController<{
    visible: boolean;
    defaultStrokeStyle: StrokeStyle;
    selectedStrokeStyle: StrokeStyle | null;
}> {
    readonly view = StrokeStylePropertySectionView;

    constructor(private readonly canvasStateStore: CanvasStateStore) {
        super({
            visible: true,
            defaultStrokeStyle: "solid",
            selectedStrokeStyle: null,
        });

        this.canvasStateStore.addListener(() => {
            this.update();
        });

        this.update();
    }

    setStrokeStyle(strokeStyle: StrokeStyle) {
        this.canvasStateStore.edit((tx) => {
            tx.updateProperty(
                this.canvasStateStore.getState().selectedEntityIds,
                PROPERTY_KEY_STROKE_STYLE,
                strokeStyle,
            );
        });

        this.setState({ ...this.state, defaultStrokeStyle: strokeStyle });
    }

    private update() {
        const selectedEntities = this.canvasStateStore
            .getState()
            .getSelectedEntities();
        const strokeStyles = new Set(
            selectedEntities
                .map((entity) =>
                    entityHandleMap().getProperty(
                        entity,
                        PROPERTY_KEY_STROKE_STYLE,
                    ),
                )
                .filter(isNotNullish),
        ) as Set<StrokeStyle>;

        this.setState({
            ...this.state,
            visible: strokeStyles.size > 0,
            selectedStrokeStyle:
                strokeStyles.size === 0
                    ? this.state.defaultStrokeStyle
                    : strokeStyles.size === 1
                      ? [...strokeStyles][0]
                      : null,
        });
    }
}

export const PROPERTY_KEY_STROKE_STYLE = "strokeStyle";
