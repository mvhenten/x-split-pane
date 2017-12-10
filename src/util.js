function h(el, attributes, ...contents) {
    const parent = document.createElement(el);

    if (attributes) {
        for (let key in attributes) {
            parent.setAttribute(key, attributes[key]);
        }
    }

    contents.forEach(content => {
        if (typeof content == "string")
            content = document.createTextNode(content);

        parent.appendChild(content);
    });

    return parent;
}

class StyleUtil extends HTMLElement {
    setStyle(style) {
        for (let key in style) {
            this.style[key] = style[key];
        }
    }
}

class BaseUtil extends StyleUtil {
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

export { h, BaseUtil, StyleUtil };