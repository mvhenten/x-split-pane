const css = `
    <style>
        .grip {
            background: #e8e8e8;
            flex-shrink: 0;
            flex-grow: 0;
        }
        
        .cols .grip {
            width: 4px;
            cursor: col-resize;
        }
        
        .rows .grip {
            height: 4px;
            cursor: row-resize;            
        }

        .panels {
            display: flex;
            height: 100%;
            box-sizing: border-box;
        }
        
        .panels.rows {
            flex-direction: column;
        }
        
        .pane {
            box-sizing: border-box;
            background-color: #fcc;
            overflow: auto;
            // border: 1px inset green;
            height: 100%;
            width: 100%;
        }
        
        .pane > * {
            background: #ccc;
        }
    </style>
`;

class Wrapper extends HTMLElement {
    get collumns() {
        return this.getAttribute("direction") != "rows";
    }

    get size() {
        if (this.collumns)
            return this.clientWidth;
        return this.clientHeight;
    }

    constructor() {
        super();
        const root = this.createShadowRoot();
        const panes = this.getElement("div", {
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

    connectedCallback() {
        this.style.display = "block";
        this.style.height = "100%";
        this.panes.classList.add(this.collumns ? "cols" : "rows");
        
        for (let child of Array.from(this.children)) {
            this.appendPane(child);
        }
    }

    getElement(tagName, attributes) {
        const element = document.createElement(tagName);

        for (let key in attributes) {
            element.setAttribute(key, attributes[key]);
        }

        return element;
    }
    
    appendChild(content) {
        this.appendPane(content);
    }

    appendPane(content) {
        const pane = this.getElement("div", {
            class: "pane"
        });

        if (this.panes.children.length)
            this.appendGrip();

        pane.appendChild(content);
        this.panes.appendChild(pane);
    }

    appendGrip() {
        const grip = this.getElement("div", {
            class: "grip"
        });
        grip.addEventListener("mousedown", this.activate.bind(this));
        this.panes.appendChild(grip);
    }


    getClientSize(child) {
        let rect = child.getBoundingClientRect();

        if (this.collumns)
            return rect.width;
            
        return rect.height;
    }

    clientPos(evt) {
        if (this.collumns)
            return evt.clientX;
        return evt.clientY;
    }

    activate(evt) {
        evt.preventDefault();
        let { target } = evt;

        let clientPos = this.clientPos(evt);
        let children = Array.from(this.panes.children);
        let panes = children.filter(child => child.classList.contains("pane"));
        let prev = children[children.indexOf(target) - 1];
        
        let sizes = panes.map(pane => Math.round((this.getClientSize(pane) / this.size) * 100));

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

        let { panes, prev, clientPos } = this.pos;
        let evtClientPos = this.clientPos(evt);
        let delta = clientPos - evtClientPos;
        let prevSize = (this.getClientSize(prev) - delta) / this.size * 100;

        this.pos.clientPos = evtClientPos;

        if (prevSize < 0)
            return;

        let currentSize = panes.reduce((sum, pane) => {
            if (pane == prev) return sum;
            return sum += this.getClientSize(pane);
        }, 0);

        let newSize = currentSize + delta;

        let sizes = panes.map((pane, i) => {
            if (pane == prev)
                return prevSize;

            currentSize = currentSize || 1;

            let size = this.getClientSize(pane) || 1;
            let newSizePixel = (size / currentSize) * newSize;

            return Math.round((newSizePixel / this.size) * 100);
        });
        
        this.distribute(panes, sizes);
    }

}

export { Wrapper };