import { h, BaseUtil } from "./util";

export default class Grip extends BaseUtil {
    get isGrip() {
        return true;
    }

    get size() {
        let key = this.parentNode.horizontal ? "clientWidth" : "clientHeight";
        return this[key];
    }

    set size(value) {
        throw new Error("You cannot set grip size");
    }

    move(evt) {
        if (!this.active)
            return;

        if (evt.stopPropagation) evt.stopPropagation();
        if (evt.preventDefault) evt.preventDefault();

        let pos = this.getMousePosition(evt);
        let delta = pos - this.pos;

        this.pos = pos;
        this.dispatchEvent(new CustomEvent("move", { 
            target: this, 
            detail: delta
        }));
    }

    attach(evt) {
        this.active = true;
        this.pos = this.getMousePosition(evt);
    }

    release(evt) {
        this.active = null;
    }
    
    getMousePosition(evt) {
        let key = this.parentNode.horizontal ? "screenX" : "screenY";
        return evt[key];
    }

    connectedCallback() {
        this.addEventListener("mousedown", this.attach.bind(this));
        window.addEventListener("mouseup", () => this.release());
        this.parentNode.addEventListener("mousemove", (evt) => this.move(evt));
    }
}
