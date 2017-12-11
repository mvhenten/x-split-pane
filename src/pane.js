import { h, BaseUtil } from "./util";

export default class Pane extends BaseUtil {
    get resizable() {
        return "" + this.getAttribute("resizable") != "false";
    }

    calculateSize() {
        const { availableSize, panels } = this.parentNode;

        let size = this.getAttribute("sxize");

        if (/px$/.test(size))
            size = parseInt(size, 10);

        if (/%$/.test(size))
            size = availableSize * (parseInt(size, 10) / 100);

        if (!size)
            size = availableSize / panels.length;

        this.size = size;
    }

    connectedCallback() {
        let event = new CustomEvent("connected", { target: this });

        this.connected = true;
        this.calculateSize();
        this.dispatchEvent(event);
    }
}
