import { entityHandleMap } from "../../../../instance";
import { isNotNullish } from "../../../../lib/isNullish";
import type { ColorId } from "../../../model/Colors";
import type { CanvasStateStore } from "../../../store/CanvasStateStore";
import { StatefulViewController } from "../../StatefulViewController";
import { ColorPropertySectionView } from "./ColorPropertySectionView";

export class ColorPropertySection extends StatefulViewController<{
    visible: boolean;
    defaultColorId: ColorId;
    selectedColorId: ColorId | null;
}> {
    readonly view = ColorPropertySectionView;

    constructor(private readonly canvasStateStore: CanvasStateStore) {
        super({
            visible: true,
            defaultColorId: 0,
            selectedColorId: null,
        });

        this.canvasStateStore.addListener(() => {
            this.update();
        });

        this.update();
    }

    setColor(colorId: ColorId) {
        this.canvasStateStore.edit((tx) => {
            tx.updateProperty(
                this.canvasStateStore.getState().selectedEntityIds,
                PROPERTY_KEY_COLOR_ID,
                colorId,
            );
        });

        this.setState({ ...this.state, defaultColorId: colorId });
    }

    private update() {
        const selectedEntities = this.canvasStateStore
            .getState()
            .getSelectedEntities();
        const colorIds = new Set(
            selectedEntities
                .map((entity) =>
                    entityHandleMap().getProperty(
                        entity,
                        PROPERTY_KEY_COLOR_ID,
                    ),
                )
                .filter(isNotNullish),
        ) as Set<ColorId>;

        this.setState({
            ...this.state,
            selectedColorId:
                colorIds.size === 0
                    ? this.state.defaultColorId
                    : colorIds.size === 1
                      ? [...colorIds][0]
                      : null,
        });
    }
}

export const PROPERTY_KEY_COLOR_ID = "colorId";
