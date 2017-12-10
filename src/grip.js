import { h, BaseUtil } from "./util";

export default class Grip extends BaseUtil {
    get isGrip() {
        return true;
    }

    get size() {
        return this.getAttribute("grip-size") || 4;
    }

    set size(value) {
        throw new Error("You cannot set grip size");
    }

    move(evt) {
        if (!this.active)
            return;

        if (evt.stopPropagation) evt.stopPropagation();
        if (evt.preventDefault) evt.preventDefault();

        let key = this.parentNode.horizontal ? "screenX" : "screenY";
        let pos = evt[key];
        let delta = pos - this.pos;

        let event = new CustomEvent("move", { target: this, detail: delta });

        this.pos = pos;
        this.dispatchEvent(event);
    }

    attach(evt) {
        this.active = true;
        let key = this.parentNode.horizontal ? "screenX" : "screenY";
        this.pos = evt[key];
    }

    release(evt) {
        this.active = null;
    }

    connectedCallback() {
        this.setStyle({
            zIndex: 100,
            cursor: "pointer",
            boxSizing: "border-box",
            display: "block",
            position: "absolute",
        });

        if (this.parentNode.horizontal) {
            this.setStyle({
                width: `${this.size}px`,
                top: 0,
                bottom: 0
            });
        }
        else {
            this.setStyle({
                height: `${this.size}px`,
                left: 0,
                right: 0
            });
        }

        this.addEventListener("mousedown", this.attach.bind(this));
        window.addEventListener("mouseup", () => this.release());
        this.parentNode.addEventListener("mousemove", (evt) => this.move(evt));
    }
}
