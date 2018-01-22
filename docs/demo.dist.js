(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

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

function getSize(columns, pane) {
    let rect = pane.getBoundingClientRect();
    let size = columns ? rect.height : rect.width;
    
    return {size};
}

class Wrapper extends HTMLElement {
    get collumns() {
        return this.getAttribute("direction") != "rows";
    }

    get size() {
        let rect = this.getBoundingClientRect();

        if (this.collumns)
            return rect.width;
            
        return rect.height;
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
        
        let panes = Array.from(this.panes.children)
            .filter(child => child.classList.contains("pane"));
            
        let index   = panes.indexOf(target.previousElementSibling);
        let sizes = panes.map(pane => getSize(this.columns, pane));
        
        this.active = true;
        this.distribute(panes, sizes);

        this.pos = {
            panes: panes,
            index,
            clientPos
        };
    }

    distribute(panes, sizes) {
        for (let child of panes) {
            let size = sizes.shift();
            let pct  = 100 * (size.size / this.size);
            child.style.flexBasis = pct + "%";
        }
    }

    resize(evt) {
        if (!this.active) return;

        let { panes, index, clientPos } = this.pos;
        let evtClientPos = this.clientPos(evt);
        let delta = clientPos - evtClientPos;
        
        let sizes = panes.map(pane => getSize(this.columns, pane));
        
        let newSizes = distribute(sizes, index, delta);
        
        this.pos.clientPos = evtClientPos;
        
        this.distribute(panes, newSizes);
    }

}


function sum(panes, prop) {
    return panes.reduce((sum, pane) => {
        if (pane[prop])
            sum += pane[prop];
            
        return sum;
    }, 0);
}

function distribute(panes, index, delta) {
    // grip always belongs to the right side of a pane
    // if going to the left, resize the next pane
    let active = delta < 0 ? index : index + 1;
    
    console.log("active", active);
    
    panes = panes.map(pane => Object.assign({}, pane));
    
    let absDelta = Math.abs(delta);

    // start with active pane.
    // if new size exceeds maxSize, return
    
    let activePane = panes[active];
    
    let newActiveSize = activePane.size + absDelta;
    
    if (activePane.maxSize && newActiveSize > activePane.maxSize)
        return panes;

    // if we resize to the left, we grow the right panel
    //    we then resize all panels to the left
    
    // [][] <- [...][][]
    // if we resize to the right, we grow the left panel
    //    then resize all panels to the right
    // [][][...] -> [][]
    
    let leftPanes = panes.slice(0, active);
    let rightPanes = panes.slice(active+1);

    // check all panes in the resize area
    // check if they have a minimWidth
    // if minWidth > newSize abort
    
    let resizePanes = delta < 0 ? rightPanes : leftPanes;
    let growPanes  = delta < 0 ? leftPanes : rightPanes;

    let oldSize = sum(resizePanes, "size");
    let minSize = sum(resizePanes, "minSize");
    let newSize = oldSize -absDelta;
    
    if (newSize < minSize)
        return panes;

    // resizing
    // if all panels we are growing are equal equal in size,
    // we resize them equally using newSize / panels
    
    // todo check we are not violating maxSize 
    let allEqual = growPanes.every(pane => Math.round(pane.size) == Math.round(activePane.size));

    if (allEqual) {
        let newGrowSize = sum(growPanes, "size") + absDelta + activePane.size;
        let newPaneSize = newGrowSize / (growPanes.length + 1);

        growPanes.forEach(pane => pane.size = newPaneSize);
        activePane.size = newPaneSize;
    }
    else {
        activePane.size = newActiveSize;
    }

    // we resize them by taking the (paneSize / oldSize) * newSize
    // only resize panes if their new size > minSize
    // ms: 100, 100, 100 (30%, 30%)
    // substract panes we don't resize from oldSize
    // todo: check minSize
    resizePanes.forEach(pane => {
        if (!pane.size)
            return;
        pane.size = (pane.size / oldSize) * newSize;
    });
    
    return panes;
}

const DEFAULT_NAMESPACE = "x-split-pane";

function register(namespace = DEFAULT_NAMESPACE) {
    customElements.define(DEFAULT_NAMESPACE, Wrapper);
}

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


register();

var x = h("x-split-pane", { 
    "direction": "rows",
    "grip-size": 1
});

var list = new Array(100).fill(1).map(i => h("li", { style: "padding: 1em; border-bottom:1px solid silver;", size: "50%" }, "Hello " + i));

x.appendChild(h("div", { style: "padding: 1em", resizable: false, size: "300px" }, "one"));
x.appendChild(h("ul", { style: "list-style: none; padding: 0; margin:0;" }, ...list));
x.appendChild(h("div", { style: "padding: 1em" }, ...list));
x.appendChild(h("div", { style: "padding: 1em" }, "four"));

// x.style.height = "80vh";

// document.getElementById("content").appendChild(x);

})));
