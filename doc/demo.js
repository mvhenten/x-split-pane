import register from "../src/index";

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
