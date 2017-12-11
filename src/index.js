import { Wrapper, Component } from "./split-pane";
import Grip from "./grip";
import Pane from "./pane";

const DEFAULT_NAMESPACE = "x-split-pane";

export default function register(namespace = DEFAULT_NAMESPACE) {
    customElements.define(DEFAULT_NAMESPACE, Wrapper);
    customElements.define('x-split-pane-grip', Grip);
    customElements.define('x-split-pane-pane', Pane);
    customElements.define('x-split-pane-panels', Component);
}