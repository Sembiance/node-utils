"use strict";

var base = require("xbase"),
	util = require("util"),
	color = require("cli-color");

exports.diff = diff;
function diff(o, n, indent)
{
	indent = (indent || 0) + 1;

	if(Object.isObject(o))
		return diffObjects(o, n, indent);
	else if(Array.isArray(o))
		return diffArray(o, n, indent);
	else
		return diffValues(o, n);
}

function diffObjects(o, n, indent)
{
	var result = "";

	var oKeys = Object.keys(o);
	var nKeys = Object.keys(n);

	var keysAdded = nKeys.subtract(oKeys);
	keysAdded.forEach(function(keyAdded) { result += " ".repeat(indent*4) + color.green(util.format("%s : %j\n", keyAdded, n[keyAdded])); });

	var keysRemoved = oKeys.subtract(nKeys);
	keysRemoved.forEach(function(keyRemoved) { result += " ".repeat(indent*4) + color.red(util.format("%s : %j\n", keyRemoved, o[keyRemoved])); });

	oKeys.subtract(keysAdded).subtract(keysRemoved).forEach(function(key)
	{
		var subResult = diff(o[key], n[key], indent);
		if(subResult)
			result += " ".repeat(indent*4) + color.yellow(key) + color.white(" : ") + subResult;
	});

	return (result.length ? "{\n" : "") + result + (result.length ? "}\n" : "");
}

function diffArray(o, n, indent)
{
	var result = "";

	n.map(function(v) { return JSON.stringify(v); }).subtract(o.map(function(v) { return JSON.stringify(v); })).forEach(function(added) { result += (result.length ? ", " : "") + color.green(added); });
	o.map(function(v) { return JSON.stringify(v); }).subtract(n.map(function(v) { return JSON.stringify(v); })).forEach(function(removed) { result += (result.length ? ", " : "") + color.red(removed); });

	return (result.length ? "[ " : "") + result + (result.length ? " ]\n" : "");
}

function diffValues(o, n)
{
	if(o!==n)
		return color.whiteBright(JSON.stringify(o)) + color.yellow(" => ") + color.whiteBright(JSON.stringify(n)) + "\n";
}
