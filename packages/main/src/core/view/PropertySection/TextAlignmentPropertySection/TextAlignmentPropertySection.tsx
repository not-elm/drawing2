import { entityHandleMap } from "../../../../instance";
import { isNotNullish } from "../../../../lib/isNullish";
import type { Entity } from "../../../model/Entity";
import type { TextAlignment } from "../../../model/TextAlignment";
import type { CanvasStateStore } from "../../../store/CanvasStateStore";
import { StatefulViewController } from "../../StatefulViewController";
import { TextAlignmentPropertySectionView } from "./TextAlignmentPropertySectionView";

export class TextAlignmentPropertySection extends StatefulViewController<{
    visible: boolean;
    defaultAlignX: TextAlignment;
    defaultAlignY: TextAlignment;
    selectedAlignX: TextAlignment | null;
    selectedAlignY: TextAlignment | null;
}> {
    readonly view = TextAlignmentPropertySectionView;

    constructor(private readonly canvasStateStore: CanvasStateStore) {
        super({
            visible: true,
            defaultAlignX: "center",
            defaultAlignY: "center",
            selectedAlignX: null,
            selectedAlignY: null,
        });

        this.canvasStateStore.addListener(() => {
            this.update();
        });

        this.update();
    }

    setTextAlign(alignmentX: TextAlignment, alignmentY: TextAlignment) {
        this.canvasStateStore.edit((tx) => {
            tx.updateProperty(
                this.canvasStateStore.getState().selectedEntityIds,
                PROPERTY_KEY_TEXT_ALIGNMENT_X,
                alignmentX,
            ).updateProperty(
                this.canvasStateStore.getState().selectedEntityIds,
                PROPERTY_KEY_TEXT_ALIGNMENT_Y,
                alignmentY,
            );
        });

        this.setState({
            ...this.state,
            defaultAlignX: alignmentX,
            defaultAlignY: alignmentY,
        });
    }

    private update() {
        const selectedEntities = this.canvasStateStore
            .getState()
            .getSelectedEntities();

        const alignmentXs = new Set(
            selectedEntities
                .map((entity) =>
                    entityHandleMap().getProperty(
                        entity,
                        PROPERTY_KEY_TEXT_ALIGNMENT_X,
                    ),
                )
                .filter(isNotNullish),
        ) as Set<TextAlignment>;

        const alignmentYs = new Set(
            selectedEntities
                .map((entity) =>
                    entityHandleMap().getProperty(
                        entity,
                        PROPERTY_KEY_TEXT_ALIGNMENT_Y,
                    ),
                )
                .filter(isNotNullish),
        ) as Set<TextAlignment>;

        this.setState({
            ...this.state,
            visible: alignmentXs.size > 0 || alignmentYs.size > 0,
            selectedAlignX:
                alignmentXs.size === 0
                    ? this.state.defaultAlignX
                    : alignmentXs.size === 1
                      ? [...alignmentXs][0]
                      : null,
            selectedAlignY:
                alignmentYs.size === 0
                    ? this.state.defaultAlignY
                    : alignmentYs.size === 1
                      ? [...alignmentYs][0]
                      : null,
        });
    }
}

export const PROPERTY_KEY_TEXT_ALIGNMENT_X = "textAlignX";
export const PROPERTY_KEY_TEXT_ALIGNMENT_Y = "textAlignY";

export function getTextAlignmentX(entity: Entity): TextAlignment | undefined {
    return entityHandleMap().getProperty(entity, PROPERTY_KEY_TEXT_ALIGNMENT_X);
}

export function getTextAlignmentY(entity: Entity): TextAlignment | undefined {
    return entityHandleMap().getProperty(entity, PROPERTY_KEY_TEXT_ALIGNMENT_Y);
}
