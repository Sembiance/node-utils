"use strict";

const XU = require("@sembiance/xu"),
	printUtil = require("../index").print;

printUtil.singleLineBooleanPie({"true" : 6407, "false" : 1477}, "Sample Boolean Pie");
printUtil.multiLineBarChart({Banana : 6407, Pear : 570, Cherry : 7421, Peach : 2, Plum : 722, Nectarine : 2224, Apple : 347, Grape : 1600}, "Sample Multi-Line Bar Chart");

printUtil.minorHeader("Minor Header", { prefix : "\n", suffix : "\n"});
printUtil.majorHeader("Major Header", { prefix : "\n", suffix : "\n"});

