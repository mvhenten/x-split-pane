(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global['x-split-pane'] = factory());
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
        // if (this.calculateSize)
        //     console.log(this.calculateSize(), 'calculated');

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
  static get observedAttributes() {return ['direction']; }
  
    constructor() {
        super();
        const root = this.createShadowRoot();

        root.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: relative;
                    width: 100%;
                    height: 100%;
                }
                
                x-split-pane-panels[direction="horizontal"] x-split-pane-grip {
                    cursor: col-resize;
                    width: var(--x-panel-grip-size, 3px);
                    top: 0;
                    bottom: 0;
                }

                x-split-pane-panels[direction="vertical"] x-split-pane-grip {
                    cursor: row-resize;
                    height: var(--x-panel-grip-size, 3px);
                    left: 0;
                    right: 0;
                }

                x-split-pane-grip {
                    background-color: #eee;
                    z-index: 100;
                    box-sizing: border-box;
                    display: block;
                    position: absolute;
                }
                
                x-split-pane-panels {
                    display: block;
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    left: 0;
                    right: 0;
                }
                
                x-split-pane-pane {
                    z-index: 50;
                    display: block;
                    box-sizing: border-box;
                    position: absolute;
                    overflow: auto;
                    height: 100%;
                    width: 100%;
                    border: var(--x-panel-pane-border, 1px inset #f9f9f9);
                }
            </style>
        `;


        const panes = h("x-split-pane-panels");

        root.appendChild(panes);

        window.addEventListener("resize", () => {
            panes.distribute();
        });
        
        this.panes = panes;
        this.root = root;
    }

    appendChild(...args) {
        this.panes.appendChild(...args);
    }

    connectedCallback() {
        this.panes.setAttribute("direction", this.getAttribute("direction"));
    }
}

class Component extends StyleUtil {
    get size() {
        return this.horizontal ? this.clientWidth : this.clientHeight;
    }

    get horizontal() {
        return this.getAttribute("direction") != "vertical";
    }

    connectedCallback() {
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

    appendChild(content) {
        const children = this.children;
        let resize = !!children.length && this.lastChild.resizable;

        if (resize) this.prependGrip();
        this.appendPanel(content);
    }

    appendPanel(content) {
        const slot = h("slot", null, content);

        const pane = h("x-split-pane-pane", {
            resizable: content.getAttribute("resizable"),
            size: content.getAttribute("size")
        }, slot);

        pane.addEventListener("connected", this.distribute.bind(this));

        super.appendChild(pane);
    }

    prependGrip() {
        const grip = h("x-split-pane-grip");

        grip.addEventListener("move", ({ target, detail }) => {
            this.resizePane(target, detail);
        });

        super.appendChild(grip);
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
                
            let size = panel.size;
                
            if (panel.resizable) {
                const scale = panel.size / panelSize;
                size = Math.round(availableSize * scale);
            }
            
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

class Pane extends BaseUtil {
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

const DEFAULT_NAMESPACE = "x-split-pane";

function register(namespace = DEFAULT_NAMESPACE) {
    customElements.define(DEFAULT_NAMESPACE, Wrapper);
    customElements.define('x-split-pane-grip', Grip);
    customElements.define('x-split-pane-pane', Pane);
    customElements.define('x-split-pane-panels', Component);
}

return register;

})));
