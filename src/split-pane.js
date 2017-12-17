import { h } from "./util";

const css = `
    <style>
        :host {
            height: 100%;
        }
        

        x-split-pane-grip {
        }
        
        
        x-split-pane-panels[direction="rows"] x-split-pane-grip {
            height: 4px;
            background: blue;
            cursor: row-resize;            
        }

        x-split-pane-panels[direction="cols"] x-split-pane-grip {
            width: 4px;
            background: red;
            cursor: col-resize;            
        }

        x-split-pane-panels {
            height: 70vh;
            background: #eee;
            box-sizing: border-box;
            display: flex;
            position: relative;
        }
        
        x-split-pane-pane {
            box-sizing: border-box;
            background: #eef;
            flex-grow: 1;
            overflow: hidden;
        }
    </style>
`;

class Wrapper extends HTMLElement {
    constructor() {
        super();
        const root = this.createShadowRoot();
        const panes = h("x-split-pane-panels");

        root.innerHTML = css;
        root.appendChild(panes);

        this.panes = panes;
        this.root = root;
    }

    appendChild(...args) {
        console.log(this.root.children);
        this.panes.appendChild(...args);
    }

    connectedCallback() {
        this.panes.setAttribute("direction", this.getAttribute("direction") || "cols");
    }
}

class Panes extends HTMLElement {
    constructor() {
        super();
        
        document.addEventListener("mousemove", this.resize.bind(this));
        document.addEventListener("mouseup", () => {
            this.active = false;
        });
    }
    
    get isColumns() {
        return this.getAttribute("direction") != "rows";
    }
    
    get size() {
        if (this.isColumns)
            return this.clientWidth;
        this.clientHeight;
    }

    clientPos(evt) {
        if (this.isColumns)
            return evt.clientX;
        return evt.clientY;
    }

    appendChild(content) {
        let pane = h("x-split-pane-pane");
        
        if (this.children.length)
            this.appendGrip();
            
        pane.appendChild(content);
        super.appendChild(pane);
    }
    
    appendGrip() {
        let grip = h("x-split-pane-grip");
        grip.addEventListener("mousedown", this.activate.bind(this));
        super.appendChild(grip);
    }

    activate(evt) {
        let {target} = evt;
        
        let clientPos = this.clientPos(evt);
        let children = Array.from(this.children);
        let panes = children.filter(child => child.pane);
        let prev = children[children.indexOf(target) - 1];

        let sizes = panes.map(pane => (pane.size / this.size) * 100);

        this.active = true;
        this.distribute(panes, sizes);

        this.pos = {
            panes: panes.slice(panes.indexOf(prev)),
            prev,
            clientPos
        };
    }
    
    distribute(panes, sizes) {
        for (let child of panes) {
            child.style.flexBasis = sizes.shift() + "%";
        }
    }
    
    resize(evt) {
        if (!this.active) return;
        
        let {panes, prev, clientPos} = this.pos;
        let evtClientPos = this.clientPos(evt);
        let delta = clientPos - evtClientPos;
        let prevSize = (prev.size - delta) / this.size * 100;

        this.pos.clientPos = evtClientPos;

        if (prevSize < 0)
            return;

        let sizeRight = panes.reduce((sum, pane) => {
        	if (pane == prev) return sum;
			return sum += pane.size;
        }, 0);

        // get the new right
        let newRight = sizeRight + delta;

        // first, get percentage of the right for each pane right
        // get size in pixel for the new right
        // then get percentage of the total
        let sizes = panes.map((pane) => {
        	if (pane == prev)
            	return prevSize;

            let newSizePixel = Math.round((pane.size / sizeRight) * newRight);
            return (newSizePixel / this.size) * 100;
        });
        
        this.distribute(panes, sizes);
    }
}

class Pane extends HTMLElement {
    get pane() {
        return true;
    }
    
    get size() {
        if (this.parentNode.isColumns)
            return this.clientWidth;
        this.clientHeight;
    }
}

class Grip extends HTMLElement {
    
}

customElements.define("x-split-pane-panels", Panes);
customElements.define("x-split-pane-pane", Pane);
customElements.define("x-split-pane-grip", Grip);



export { Wrapper };