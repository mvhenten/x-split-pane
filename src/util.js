
class BaseUtil extends HTMLElement {
    constructor() {
        super();
        this.dimensions = {};
    }

    get size() {
        if (this.dimensions.size)
            return this.dimensions.size;

        let key = this.parentNode.horizontal ? "clientWidth" : "clientHeight";
        return this[key];
    }

    set size(value) {
        let key = this.parentNode.horizontal ? "width" : "height";
        this.style[key] = `${value}px`;
        this.dimensions.size = value;
    }

    set offset(value) {
        let key = this.parentNode.horizontal ? "left" : "top";
        this.style[key] = `${value}px`;
        this.dimensions.offset = value;
    }

    get offset() {
        return this.dimensions.offset;
    }
}

export {  BaseUtil };