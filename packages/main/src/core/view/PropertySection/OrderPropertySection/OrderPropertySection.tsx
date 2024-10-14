import type { CanvasStateStore } from "../../../store/CanvasStateStore";
import { StatefulViewController } from "../../StatefulViewController";
import { OrderPropertySectionView } from "./OrderPropertySectionView";

export class OrderPropertySection extends StatefulViewController<{
    visible: boolean;
}> {
    readonly view = OrderPropertySectionView;

    constructor(private readonly canvasStateStore: CanvasStateStore) {
        super({
            visible: true,
        });

        this.canvasStateStore.addListener(() => {
            this.update();
        });

        this.update();
    }

    bringToFront() {
        this.canvasStateStore.bringToFront();
    }

    bringForward() {
        this.canvasStateStore.bringForward();
    }

    sendBackward() {
        this.canvasStateStore.sendBackward();
    }

    sendToBack() {
        this.canvasStateStore.sendToBack();
    }

    private update() {
        this.setState({
            ...this.state,
            visible:
                this.canvasStateStore.getState().selectedEntityIds.length > 0,
        });
    }
}
