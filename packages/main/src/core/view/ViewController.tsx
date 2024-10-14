import type { ReactElement } from "react";

export interface ViewController {
    render(props?: { key?: string | number }): ReactElement;
}
