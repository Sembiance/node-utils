"use strict";

const XU = require("@sembiance/xu"),
	printUtil = require("../index").print;

printUtil.singleLineBooleanPie({"true" : 6407, "false" : 1477}, "Sample Boolean Pie");
printUtil.multiLineBarChart({Banana : 6407, Pear : 570, Cherry : 7421, Peach : 2, Plum : 722, Nectarine : 2224, Apple : 347, Grape : 1600}, "Sample Multi-Line Bar Chart");

printUtil.log("%#FF202010s: %#FFFFFF5d%% (%#AF00D7is) %j", "Purple", 13, "Italic", { abc : 123 });
printUtil.log("%#FF202010s: %#FFFFFF5d%% (%#FF5F00us) %j", "Orange", 4700, "Underline", { abc : 123 });
printUtil.log("%#FF202010s: %#FFFFFF5d%% (%#87FF00bs) %j", "Lime", 2000, "Bold", { abc : 123 });
printUtil.log("%#FF202010s: %#FFFFFF5d%% (%#005FFFvs) %j", "Blue", 47, "Inverse", { abc : 123 });
printUtil.log("%#FF202010s: %#FFFFFF5d%% (%#00FF00ss) %j", "Green", 382, "Strike-Through", { abc : 123 });

printUtil.minorHeader("Minor Header", { prefix : "\n", suffix : "\n"});
printUtil.majorHeader("Major Header", { prefix : "\n", suffix : "\n"});
