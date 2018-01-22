import { Wrapper } from "./split-pane";

const DEFAULT_NAMESPACE = "x-split-pane";

export default function register(namespace = DEFAULT_NAMESPACE) {
    customElements.define(DEFAULT_NAMESPACE, Wrapper);
}