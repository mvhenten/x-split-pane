import { h, BaseUtil } from "./util";

export default class Pane extends BaseUtil {
    calculateSize() {
        const { availableSize, panels } = this.parentNode;

        let size = this.firstChild.getAttribute("pane-size");

        if (/px$/.test(size))
            size = parseInt(size, 10);

        if (/%$/.test(size))
            size = availableSize * (parseInt(size, 10) / 100);

        if (!size)
            size = availableSize / panels.length;

        this.size = size;
    }

    connectedCallback() {
        this.setStyle({
            zIndex: 50,
            display: "block",
            boxSizing: "border-box",
            position: "absolute",
            overflow: "auto",
            height: "100%",
            width: "100%",
            backgroundColor: "#009",
            border: "1px solid black",
        });

        this.calculateSize();
        this.connected = true;

        let event = new CustomEvent("connected", { target: this });
        this.dispatchEvent(event);
    }
}
