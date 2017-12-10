(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

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

class Wrapper extends StyleUtil {
    constructor() {
        super();

        const panes = h("x-split-pane", {
            direction: this.getAttribute("pane-direction")
        });

        this.panes = panes;
        this.root = this.createShadowRoot();
        this.root.appendChild(panes);

        window.addEventListener("resize", () => {
            panes.distribute();
        });
    }

    connectedCallback() {
        this.setStyle({
            display: "block",
            position: "relative",
            width: "100%",
            height: "100%",
            backgroundColor: "#990000"
        });
    }

    appendChild(...args) {
        this.panes.appendChild(...args);
    }
}

class Component extends StyleUtil {
    get size() {
        return this.horizontal ? this.clientWidth : this.clientHeight;
    }

    get horizontal() {
        return this.getAttribute("pane-direction") != "vertical";
    }

    connectedCallback() {
        this.setStyle({
            display: "block",
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
        });

        this.mounted = true;
        this.distribute();
    }

    get panels() {
        return Array.from(this.children)
            .filter(child => !child.isGrip);
    }

    get availableSize() {
        return Array.from(this.children).reduce((size, child) => {
            if (child.isGrip)
                return size - child.size;
            return size;
        }, this.size);
    }

    appendChild(...args) {
        if (this.childNodes.length)
            this.appendGrip();

        this.appendPanel(...args);
    }

    appendPanel(content) {
        const slot = h("slot", null, content);

        const attributes = {
            "pane-direction": this.getAttribute("pane-direction"),
            "pane-size": content.getAttribute("pane-size"),
            "pane-resizable": content.getAttribute("pane-resizable")
        };

        const pane = h("x-split-pane-hpane", attributes, slot);

        super.appendChild(pane);
        pane.addEventListener("connected", () => this.distribute());
    }

    appendGrip() {
        const grip = h("x-split-pane-hgrip");
        super.appendChild(grip);

        grip.addEventListener("move", ({ target, detail }) => {
            this.resizePane(target, detail);
        });
    }

    resizePane(grip, delta) {
        let before = grip.previousSibling;
        let after = grip.nextSibling;
        let offset = grip.offset + delta;

        if (before.offset > offset)
            return;

        if (after.size - delta <= 0)
            return;

        before.size = before.size + delta;
        after.size = after.size - delta;
        after.offset = after.offset + delta;
        grip.offset = grip.offset + delta;
    }

    calculatePanelSize() {
        const { availableSize, panels } = this;
        const panelSize = panels.reduce((panelSize, panel) => panelSize += panel.size, 0);

        let allocatedSize = 0;

        return panels.map((panel, index) => {
            if (index == panels.length - 1)
                return availableSize - allocatedSize;

            const scale = panel.size / panelSize;
            const size = Math.round(availableSize * scale);

            allocatedSize += size;

            return size;
        });
    }

    distribute() {
        if (!this.panels.every(panel => panel.connected))
            return;

        const panelSizes = this.calculatePanelSize();
        let offset = 0;

        Array.from(this.children).forEach((child, index) => {
            if (!child.isGrip)
                child.size = panelSizes.shift();

            child.offset = offset;
            offset += child.size;
        });
    }
}

class Grip extends BaseUtil {
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

class Pane extends BaseUtil {
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

const DEFAULT_NAMESPACE = "x-split-pane";

function register(namespace=DEFAULT_NAMESPACE) {
    customElements.define('x-split-pane-component', Wrapper);
    customElements.define('x-split-pane-hgrip', Grip);
    customElements.define('x-split-pane-hpane', Pane);
    customElements.define('x-split-pane', Component);
}

register();

var x = h("x-split-pane-component", { direction: "horizontal" });

var list = new Array(100).fill(1).map(i => h("li", { style: "padding: 1em; background: #099", size: "50%" }, "Hello " + i));

x.appendChild(h("div", { style: "border: 4px solid red" }, "one"));
x.appendChild(h("ul", { style: "list-style: none; padding: 0; margin:0" }, ...list));
x.appendChild(h("div", { "panel-size": "50%", style: "border: 4px solid red" }, "three"));

// setTimeout(() => x.distribute(), 100);



document.getElementById("content").appendChild(x);

})));
