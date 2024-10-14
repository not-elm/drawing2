import type { Mode } from "../../model/Mode";
import type { AppStateStore } from "../../store/AppStateStore";
import { StatefulViewController } from "../StatefulViewController";
import { ToolBarView } from "./ToolBarView";

export class ToolBar extends StatefulViewController<{
    buttons: { label: string; mode: Mode }[];
    mode: Mode;
}> {
    readonly view = ToolBarView;

    constructor(private readonly appStateStore: AppStateStore) {
        super({ buttons: [], mode: appStateStore.getState().mode });

        this.appStateStore.addListener(() => {
            this.setState({
                ...this.state,
                mode: this.appStateStore.getState().mode,
            });
        });
    }

    addButton(label: string, mode: Mode): this {
        this.setState({
            ...this.state,
            buttons: [...this.state.buttons, { label, mode }],
        });
        return this;
    }

    setMode(mode: Mode) {
        this.appStateStore.setMode(mode);
    }
}
