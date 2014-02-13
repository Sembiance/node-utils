"use strict";

var assert = require("assert"),
	diffUtil = require("../index").diff;

console.log(diffUtil.diff("a", "b"));
console.log(diffUtil.diff(1, 2));
console.log(diffUtil.diff(true, false));

console.log(diffUtil.diff(["a", 1, true], ["b", 1, 2]));

console.log(diffUtil.diff({num:1, sexy:true, color:"red", pets : ["cat", "dog"], employed:false}, {num:6, color:"green", pets : ["cat", "bird"], employed:true, age:47}));
