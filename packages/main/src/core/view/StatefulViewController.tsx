import { type ComponentType, type ReactElement, createElement } from "react";
import { type StateOf, Store } from "../../lib/Store";
import { useStore } from "../../react/hooks/useStore";
import type { ViewController } from "./ViewController";

export abstract class StatefulViewController<S>
    extends Store<S>
    implements ViewController
{
    abstract view: StatefulViewControllerComponent<this>;

    render(props?: { key?: string | number }): ReactElement {
        return createElement(ComponentWithController<S>, {
            ...props,
            controller: this,
        });
    }
}

type StatefulViewControllerComponent<T> = ComponentType<{
    controller: T;
    state: StateOf<T>;
}>;

function ComponentWithController<S>({
    controller,
}: {
    controller: StatefulViewController<S>;
}): ReactElement {
    const View = controller.view;
    const state = useStore(controller);

    return <View controller={controller} state={state} />;
}
