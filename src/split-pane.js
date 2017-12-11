import { h } from "./util";

class Wrapper extends HTMLElement {
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

class Component extends HTMLElement {
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

export { Wrapper, Component };