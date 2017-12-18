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

const css = `
    <style>
        :host {
            // height: 100%;
        }
        
        .grip {
            width: 4px;
            background: red;
            cursor: col-resize;            
            
        }
        
        .grip.rows {
            height: 4px;
            background: blue;
            cursor: row-resize;            
        }

        .panels {
            display: flex;
            height: 100%;
            box-sizing: border-box;
        }
        
        .pane {
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
        const panes = h("div", {
            class: "panels"
        });

        root.innerHTML = css;
        root.appendChild(panes);

        this.panes = panes;
        this.root = root;

        document.addEventListener("mousemove", this.resize.bind(this));
        document.addEventListener("mouseup", () => {
            this.active = false;
        });
    }

    appendChild(content) {
        let pane = h("div", {
            class: "pane"
        });
        
        if (this.panes.children.length)
            this.appendGrip();
            
        pane.appendChild(content);
        this.panes.appendChild(pane);
    }

    appendGrip() {
        let grip = h("div", {
            class: "grip"
        });
        grip.addEventListener("mousedown", this.activate.bind(this));
        this.panes.appendChild(grip);
    }

    connectedCallback() {
        this.style.display = "block";
        // this.panes.style.height = this.style.height;
        this.panes.setAttribute("direction", this.getAttribute("direction") || "cols");
    }

    get isColumns() {
        return this.getAttribute("direction") != "rows";
    }
    
    get size() {
        if (this.isColumns)
            return this.clientWidth;
        this.clientHeight;
    }
    
    getClientSize(child) {
        if (this.isColumns)
            return child.clientWidth;
        child.clientHeight;
    }

    clientPos(evt) {
        if (this.isColumns)
            return evt.clientX;
        return evt.clientY;
    }

    activate(evt) {
        let {target} = evt;
        
        let clientPos = this.clientPos(evt);
        let children = Array.from(this.panes.children);
        let panes = children.filter(child => /pane/.test(child.className));
        let prev = children[children.indexOf(target) - 1];
        let sizes = panes.map(pane => (this.getClientSize(pane) / this.size) * 100);
        
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
        let prevSize = (this.getClientSize(prev) - delta) / this.size * 100;

        this.pos.clientPos = evtClientPos;

        if (prevSize < 0)
            return;

        let sizeRight = panes.reduce((sum, pane) => {
        	if (pane == prev) return sum;
			return sum += this.getClientSize(pane);
        }, 0);

        // get the new right
        let newRight = sizeRight + delta;

        // first, get percentage of the right for each pane right
        // get size in pixel for the new right
        // then get percentage of the total
        let sizes = panes.map((pane) => {
        	if (pane == prev)
            	return prevSize;

            let newSizePixel = Math.round((this.getClientSize(pane) / sizeRight) * newRight);
            return (newSizePixel / this.size) * 100;
        });
        
        this.distribute(panes, sizes);
    }
    
}

export { Wrapper };