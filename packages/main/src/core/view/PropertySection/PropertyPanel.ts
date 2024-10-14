import { StatefulViewController } from "../StatefulViewController";
import type { ViewController } from "../ViewController";
import { PropertyPanelView } from "./PropertyPanelView";

export class PropertyPanel extends StatefulViewController<{
    sectionControllers: ViewController[];
}> {
    readonly view = PropertyPanelView;

    constructor() {
        super({
            sectionControllers: [],
        });
    }

    addSection(controller: ViewController): this {
        this.setState({
            sectionControllers: [...this.state.sectionControllers, controller],
        });

        return this;
    }
}
