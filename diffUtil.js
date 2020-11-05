"use strict";
/* eslint-disable prefer-template */
const XU = require("@sembiance/xu"),
	util = require("util"),
	ansidiff = require("ansidiff"),
	chalk = require("chalk");

chalk.level = 2;

exports.diff = diff;
function diff(o, n, _options={})
{
	const options = XU.clone(_options);
	options.indent = (options.indent || 0) + 1;

	if(Object.isObject(o))
		return diffObjects(o, n, options);
	else if(Array.isArray(o))
		return diffArray(o, n, options);
	
	return diffValues(o, n, options);
}

function diffObjects(o, n, options={})
{
	let result = "";

	const oKeys = Object.keys(o);
	const nKeys = Object.keys(n);

	const keysAdded = nKeys.subtractAll(oKeys);
	keysAdded.forEach(keyAdded => { result += " ".repeat(options.indent*4) + chalk.green(util.format("%s : %j\n", keyAdded, n[keyAdded])); });

	const keysRemoved = oKeys.subtractAll(nKeys);
	if(!options.ignoreRemovedKeys)
		keysRemoved.forEach(keyRemoved => { result += " ".repeat(options.indent*4) + chalk.red(util.format("%s : %j\n", keyRemoved, o[keyRemoved])); });

	oKeys.subtractAll(keysAdded).subtractAll(keysRemoved).forEach(key =>
	{
		const subResult = diff(o[key], n[key], options);
		if(subResult)
			result += " ".repeat(options.indent*4) + chalk.yellow(key) + chalk.white(" : ") + subResult;
	});

	return (result.length ? "{\n" : "") + result + (result.length ? "}\n" : "");
}

function diffArray(o, n, options)
{
	let result = "";

	if(options.compareArraysDirectly)
	{
		if(o.length!==n.length)
		{
			result += `Arrays are not equal length, cannot compare them directly: old [${o.length}] vs new [${n.length}]`;
		}
		else
		{
			o.forEach((item, i) =>
			{
				const subResult = diff(item, n[i], options);
				if(subResult)
					result += " ".repeat(options.indent*4) + "[" + i + "]" + (options.arrayKey && item.hasOwnProperty(options.arrayKey) ? (" " + item[options.arrayKey]) : "") + ": " + subResult;
			});
		}
	}
	else
	{
		n.map(v => JSON.stringify(v)).subtractAll(o.map(v => JSON.stringify(v))).forEach(added => { result += (result.length ? ", " : "") + chalk.green(added); });
		o.map(v => JSON.stringify(v)).subtractAll(n.map(v => JSON.stringify(v))).forEach(removed => { result += (result.length ? ", " : "") + chalk.red(removed); });
	}

	return (result.length ? "[ " : "") + result + (result.length ? " ]\n" : "");
}

function diffValues(o, n)
{
	if(o!==n)
	{
		if(typeof o==="string")
			return ansidiff.words(JSON.stringify(o), JSON.stringify(n), ansidiff.subtle) + "\n";

		return chalk.whiteBright(JSON.stringify(o)) + chalk.yellow(" => ") + chalk.whiteBright(JSON.stringify(n)) + "\n";
	}

	return "";
}
