"use strict";

const XU = require("@sembiance/xu"),
	util = require("util"),
	chalk = require("chalk");

chalk.level = 2;

exports.toSize = function toSize(num, precision=1)
{
	if(num<XU.KB)
		return num.toLocaleString() + " bytes";
	else if(num<XU.MB)
		return (num/XU.KB).toLocaleString("en", {minimumFractionDigits : precision, maximumFractionDigits : precision}) + "KB";
	else if(num<XU.GB)
		return (num/XU.MB).toLocaleString("en", {minimumFractionDigits : precision, maximumFractionDigits : precision}) + "MB";
	else if(num<XU.TB)
		return (num/XU.GB).toLocaleString("en", {minimumFractionDigits : precision, maximumFractionDigits : precision}) + "GB";
	else if(num<XU.PB)
		return (num/XU.TB).toLocaleString("en", {minimumFractionDigits : precision, maximumFractionDigits : precision}) + "TB";
};

exports.columnizeObject = function columnizeObject(o, options={})
{
	let rows = Object.reduce(o, (k, v, r) => { r.push([k, v]); return r; }, []);
	if(options.sorter)
		rows.sort(options.sorter);

	if(options.formatter)
		rows = rows.map(options.formatter);
	else
		rows = rows.map(row => { row[1] = (typeof row[1]==="number" ? row[1].toLocaleString() : row[1]); return row; });

	if(options.header)
		rows.splice(0, 0, options.header);

	if(options.alignment)
		options.alignment = options.alignment.map(a => a.substring(0, 1).toLowerCase());

	const maxColSizes = [];
	rows.forEach(row => row.forEach((col, i) => { maxColSizes[i] = Math.max((maxColSizes[i] || 0), (""+col).length); }));

	if(options.header)
		rows.splice(1, 0, maxColSizes.map(maxColSize => chalk.hex("#00FFFF")("-".repeat(maxColSize))));

	let result = "";

	const spacing = options.padding || 5;
	rows.forEach((row, rowNum) =>
	{
		let rowOut = "";
		row.forEach((_col, i) =>
		{
			const col = "" + _col;
			
			const a = (options.header && rowNum===0) ? "c" : (options.alignment ? (options.alignment[i] || "l") : "l");
			const colPadding = maxColSizes[i] - col.length;

			if(a==="c" || a==="r")
				rowOut += " ".repeat(Math.floor(colPadding/(a==="c" ? 2 : 1)));

			rowOut += col;

			if(a==="c" || a==="l")
				rowOut += " ".repeat(Math.round(colPadding/(a==="c" ? 2 : 1)));

			rowOut += " ".repeat(spacing);
		});

		result += rowOut + "\n";
	});

	return result;
};

exports.columnizeObjects = function columnizeObjects(objects, options={})
{
	const rows = XU.clone(objects);
	chalk.level = (options.noColor ? 0 : 2);

	const colNames = options.colNames || rows.map(object => Object.keys(object).filter(k => !k.startsWith("_"))).flat().unique();
	const colNameMap = Object.assign(colNames.reduce((r, colName) => { r[colName] = colName.replace( /([A-Z])/g, " $1" ).toProperCase(); return r; }, {}), options.colNameMap || {});	// eslint-disable-line prefer-named-capture-group
	const alignmentDefault = options.alignmentDefault || "l";
	const colTypes = colNames.map(colName => (typeof rows[0][colName]));
	const booleanValues = options.booleanValues || ["True", "False"];

	if(options.sorter)
		rows.sort(options.sorter);

	if(options.formatter)
		rows.forEach(object => colNames.forEach(colName => { object[colName] = options.formatter(colName, object[colName], object); }));
	else
		rows.forEach(object => colNames.forEach((colName, i) => { const v=object[colName]; object[colName] = colTypes[i]==="boolean" ? booleanValues[v ? 0 : 1] : (colTypes[i]==="number" ? (typeof v==="number" ? v.toLocaleString() : 0) : v); }));

	const maxColSizeMap = {};

	rows.forEach(row => colNames.forEach(colName => { if(row.hasOwnProperty(colName)) { maxColSizeMap[colName] = Math.max((maxColSizeMap[colName] || 0), (""+row[colName]).length, colNameMap[colName].length); } }));	// eslint-disable-line curly

	rows.splice(0, 0, Object.map(colNameMap, (k, v) => v), Object.map(colNameMap, k => [k, chalk.hex("#00FFFF")("-".repeat(maxColSizeMap[k]))]));

	let result = "";

	rows.forEach((row, rowNum) =>
	{
		let rowOut = "";
		colNames.forEach((colName, i) =>
		{
			const col = "" + row[colName];
			const a = rowNum===0 ? "c" : (options.alignment ? (options.alignment[colName] || alignmentDefault) : (colTypes[i]==="number" ? "r" : (colTypes[i]==="boolean" ? "c" : alignmentDefault)));
			const colPadding = maxColSizeMap[colName] - col.length;

			if(a==="c" || a==="r")
				rowOut += " ".repeat(Math.floor(colPadding/(a==="c" ? 2 : 1)));

			let color = rowNum===0 ? "#FFFFFF" : null;
			if(rowNum>1 && options && options.color && options.color[colName])
			{
				if((typeof options.color[colName]==="function"))
					color = options.color[colName](objects[rowNum-2][colName], objects[rowNum-2]);
				else
					color = options.color[colName];
			}

			rowOut += (color ? chalk.hex(color)(col) : col);

			if(a==="c" || a==="l")
				rowOut += " ".repeat(Math.round(colPadding/(a==="c" ? 2 : 1)));

			rowOut += " ".repeat((options.padding ? (typeof options.padding==="function" ? options.padding(colName) : (Object.isObject(options.padding) ? (options.padding[colName] || 5) : options.padding)) : 5));
		});

		result += rowOut + (row.hasOwnProperty("_suffix") ? row._suffix : "") + "\n";	// eslint-disable-line no-underscore-dangle
	});

	return (options.noHeader ? result.split("\n").slice(2).join("\n") : result);
};

exports.singleLineBooleanPie = function singleLineBooleanPie(o, label="Label", lineLength=120)
{
	const COLORS = ["#FF5F00", "#AF5FD7", "#D7FF00", "#005FFF"];
	const barLength = lineLength-(label.length+2);
	const keys = Object.keys(o);
	const values = Object.values(o);
	const TOTAL = Object.values(o).sum();

	if(keys.length===1)
		keys.push(keys[0]==="true" ? "false" : "true");
	if(values.length===1)
		values.push(0);

	// Labels
	process.stdout.write(chalk.whiteBright(label) + ": ");
	process.stdout.write(chalk.hex("#FFFF00")(keys[0]));
	const firstValue = " " + values[0].toLocaleString() + " (" + Math.round((values[0]/TOTAL)*100) + "%)";
	process.stdout.write(firstValue);
	const secondValue = " " + values[1].toLocaleString() + " (" + Math.round((values[1]/TOTAL)*100) + "%)";
	process.stdout.write(" ".repeat(barLength-((keys[0].length+keys[1].length+firstValue.length+secondValue.length)-1)));
	process.stdout.write(chalk.hex("#FFFF00")(keys[1]));
	process.stdout.write(secondValue);
	process.stdout.write("\n");

	// Pie
	process.stdout.write(" ".repeat(label.length+1) + chalk.cyanBright("["));
	values.forEach((v, i) => process.stdout.write(chalk.hex(COLORS[i])("█".repeat(barLength*(v/TOTAL)))));
	process.stdout.write(chalk.cyanBright("]"));

	process.stdout.write("\n\n");
};

exports.multiLineBarChart = function multiLineBarChart(o, label="Label", lineLength=120)
{
	if(!o)
		return;

	const COLORS = ["#FF8700", "#AF5FD7", "#00FF5F", "#D7FF00", "#D70087", "#005FFF", "#BCBCBC"].pushCopyInPlace(100);
	const LINES = Object.entries(o).sort((a, b) => b[1]-a[1]);
	const TOTAL = Object.values(o).sum();
	const VALUES = LINES.map(line => line[1].toLocaleString() + " (" + Math.round((line[1]/TOTAL)*100) + "%)");
	const longestKey = LINES.map(line => line[0].length).sort((a, b) => b-a)[0];
	const barLength = lineLength-(longestKey+2);

	process.stdout.write(" ".repeat(Math.round((lineLength-label.length)/2)) + chalk.yellowBright(label) + "\n");
	process.stdout.write(chalk.cyanBright("=").repeat(lineLength) + "\n");

	LINES.forEach((LINE, i) =>
	{
		process.stdout.write(chalk.whiteBright(LINE[0].padStart(longestKey)) + ": ");
		process.stdout.write(chalk.hex(COLORS[i])("█".repeat(Math.max((LINE[1] > 0 ? 1 : 0), Math.round(barLength*(LINE[1]/TOTAL))))));
		process.stdout.write(" " + VALUES[i]);
		process.stdout.write("\n");
	});

	process.stdout.write("\n");
};

// An advanced log function that supports padded length strings and numbers and color
// %10s : Will pad the left side of the string with spaces to at least 10 length. Can also pad all other values such as %7d
// %D   : Auto formats the string with .toLocaleString()
// %j   : Outputs colorized JSON on 1 line
// %J	: Outputs colorized JSON over multiple lines
// %#FFFFFFs : Outputs the string (or digit or whatever) in the given hex color.
// %#FFFFFF[bdiuvsh] : Outputs the string in the given color with the letter modifier, see MODIFIERS map below
// %0.2f : Output a float formatted value
exports.log = function log(s, ...args)
{
	const MODIFIERS =
	{
		b   : "bold",
		m   : "dim",
		i   : "italic",
		u   : "underline",
		v   : "inverse",
		"-" : "strikethrough",
		h   : "hidden"
	};
	let codeNum = 0;

	for(let i=0;i<s.length;i++)
	{
		const part = s.substring(i);
		const code = part.match(/^%(?<color>#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f])?(?<modifier>[bmiuvh-])?(?<numLength>[0-9]+)?[.]?(?<decimalPlaces>[0-9]+)?(?<type>[sdDjJf%])/);
		if(code && code.groups)
		{
			let v = "";
			switch(code.groups.type)
			{
				case "%":
					v = "%";
					break;
				case "d":
					v = +args[codeNum++];
					break;
				case "f":
					v = args[codeNum++].toFixed(+code.groups.decimalPlaces);
					break;
				case "D":
					v = (+args[codeNum++]).toLocaleString();
					break;
				case "s":
					v = args[codeNum++];
					break;
				case "j":
					v = util.inspect(args[codeNum++], {colors : true, depth : Infinity, breakLength : Infinity});
					break;
				case "J":
					v = util.inspect(args[codeNum++], {colors : true, depth : Infinity});
					break;
			}

			if(code.groups.numLength && ((+code.groups.numLength)-v.length)>0)
				v = v.padStart(code.groups.numLength, " ");

			if(code.groups.color && code.groups.modifier)
				process.stdout.write(chalk.hex(code.groups.color)[MODIFIERS[code.groups.modifier]](v));
			else if(code.groups.color)
				process.stdout.write(chalk.hex(code.groups.color)(v));
			else
				process.stdout.write(chalk.reset(v));

			i += code[0].length-1;
			continue;
		}

		process.stdout.write(chalk.reset(s.charAt(i)));
	}

	process.stdout.write("\n");
};

// Prints out a major header that looks like this:
// /--------------\
// | Major Header |
// \--------------/
exports.majorHeader = function majorHeader(text, options={})
{
	if(options.prefix)
		process.stdout.write(options.prefix);

	exports.log("%#00FFFFs", "/" + "-".repeat(text.length+2) + "\\");
	exports.log("%#00FFFFs %" + (options.color || "#FFFFFF") + "s %#00FFFFs", "|", text, "|");
	exports.log("%#00FFFFs", "\\" + "-".repeat(text.length+2) + "/");

	if(options.suffix)
		process.stdout.write(options.suffix);
};

// Prints out a minor header that looks like this:
// Minor Header
// ------------
exports.minorHeader = function minorHeader(text, options={})
{
	if(options.prefix)
		process.stdout.write(options.prefix);

	exports.log("%" + (options.color || "#FFFFFF") + "s", text);
	exports.log("%#00FFFFs", "-".repeat(text.length));

	if(options.suffix)
		process.stdout.write(options.suffix);
};

// Prints out a list of items with an optional "header" in options
exports.list = function list(items, options={})
{
	if(options.prefix)
		process.stdout.write(options.prefix);

	if(options.header)
		exports[(options.headerType==="major" ? "major" : "minor") + "Header"](options.header, (options.headerColor ? { color : options.headerColor } : undefined));

	items.forEach(item => process.stdout.write(" ".repeat(options.indent || 2) + "* " + item + "\n"));

	if(options.suffix)
		process.stdout.write(options.suffix);
};
