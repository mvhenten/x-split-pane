import { h, StyleUtil } from "./util";

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

export { Wrapper, Component };