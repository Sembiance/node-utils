"use strict";

var base = require("xbase"),
	util = require("util"),
	ansidiff = require("ansidiff"),
	color = require("cli-color");

exports.diff = diff;
function diff(o, n, options)
{
	options = base.clone((options || {}));
	options.indent = (options.indent || 0) + 1;

	if(Object.isObject(o))
		return diffObjects(o, n, options);
	else if(Array.isArray(o))
		return diffArray(o, n, options);
	else
		return diffValues(o, n, options);
}

function diffObjects(o, n, options)
{
	var result = "";

	var oKeys = Object.keys(o);
	var nKeys = Object.keys(n);

	var keysAdded = nKeys.subtract(oKeys);
	keysAdded.forEach(function(keyAdded) { result += " ".repeat(options.indent*4) + color.green(util.format("%s : %j\n", keyAdded, n[keyAdded])); });

	var keysRemoved = oKeys.subtract(nKeys);
	keysRemoved.forEach(function(keyRemoved) { result += " ".repeat(options.indent*4) + color.red(util.format("%s : %j\n", keyRemoved, o[keyRemoved])); });

	oKeys.subtract(keysAdded).subtract(keysRemoved).forEach(function(key)
	{
		var subResult = diff(o[key], n[key], options);
		if(subResult)
			result += " ".repeat(options.indent*4) + color.yellow(key) + color.white(" : ") + subResult;
	});

	return (result.length ? "{\n" : "") + result + (result.length ? "}\n" : "");
}

function diffArray(o, n, options)
{
	var result = "";

	if(options.compareArraysDirectly)
	{
		if(o.length!==n.length)
		{
			result += "Arrays are not equal length, cannot compare them directly: old [" + o.length + "] vs new [" + n.length + "]";	
		}
		else
		{
			o.forEach(function(item, i)
			{
				var subResult = diff(item, n[i], options);
				if(subResult)
					result += " ".repeat(options.indent*4) + "[" + i + "]" + (options.arrayKey && item.hasOwnProperty(options.arrayKey) ? (" " + item[options.arrayKey]) : "") + ": " + subResult;
			});
		}
	}
	else
	{
		n.map(function(v) { return JSON.stringify(v); }).subtract(o.map(function(v) { return JSON.stringify(v); })).forEach(function(added) { result += (result.length ? ", " : "") + color.green(added); });
		o.map(function(v) { return JSON.stringify(v); }).subtract(n.map(function(v) { return JSON.stringify(v); })).forEach(function(removed) { result += (result.length ? ", " : "") + color.red(removed); });
	}

	return (result.length ? "[ " : "") + result + (result.length ? " ]\n" : "");
}

function diffValues(o, n, options)
{
	if(o!==n)
	{
		if(typeof o==="string")
			return ansidiff.words(JSON.stringify(o), JSON.stringify(n), ansidiff.subtle) + "\n";
		else
			return color.whiteBright(JSON.stringify(o)) + color.yellow(" => ") + color.whiteBright(JSON.stringify(n)) + "\n";
	}
}
