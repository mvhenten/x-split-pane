import { Wrapper, Component } from "./split-pane";
import Grip from "./grip";
import Pane from "./pane";

const DEFAULT_NAMESPACE = "x-split-pane";

export default function register(namespace = DEFAULT_NAMESPACE) {
    customElements.define('x-split-pane-component', Wrapper);
    customElements.define('x-split-pane-hgrip', Grip);
    customElements.define('x-split-pane-hpane', Pane);
    customElements.define('x-split-pane', Component);
}