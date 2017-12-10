import register from "../src/index";
import {h} from "../src/util";

register();

var x = h("x-split-pane-component", { direction: "horizontal" });

var list = new Array(100).fill(1).map(i => h("li", { style: "padding: 1em; background: #099", size: "50%" }, "Hello " + i));

x.appendChild(h("div", { style: "border: 4px solid red" }, "one"));
x.appendChild(h("ul", { style: "list-style: none; padding: 0; margin:0" }, ...list));
x.appendChild(h("div", { "panel-size": "50%", style: "border: 4px solid red" }, "three"));

// setTimeout(() => x.distribute(), 100);



document.getElementById("content").appendChild(x);
