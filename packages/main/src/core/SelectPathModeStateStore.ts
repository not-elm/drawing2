import { Store } from "../lib/Store";

export class SelectPathModeStateStore extends Store<{
    highlightedItemIds: Set<string>;
    highlightCenterOfEdgeHandle: boolean;
}> {
    constructor() {
        super({
            highlightedItemIds: new Set(),
            highlightCenterOfEdgeHandle: false,
        });
    }

    setHighlight(state: {
        highlightedItemIds: Set<string>;
        highlightCenterOfEdgeHandle: boolean;
    }) {
        this.setState({ ...this.state, ...state });
    }

    clearHighlight() {
        this.setState({
            highlightedItemIds: new Set(),
            highlightCenterOfEdgeHandle: false,
        });
    }
}
