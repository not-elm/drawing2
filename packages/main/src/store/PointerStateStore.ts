import { Store } from "../lib/Store";

interface PointerState {
	x: number;
	y: number;
}

export class PointerStateStore extends Store<PointerState> {
	constructor() {
		super({ x: 0, y: 0 });
	}

	setPosition(x: number, y: number): void {
		this.setState({ x, y });
	}
}
