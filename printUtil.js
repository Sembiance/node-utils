"use strict";

const XU = require("@sembiance/xu"),
	clc = require("cli-color");

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
	rows.forEach(row => { row.forEach((col, i) => { maxColSizes[i] = Math.max((maxColSizes[i] || 0), (""+col).length); }); });

	if(options.header)
		rows.splice(1, 0, maxColSizes.map(maxColSize => "-".repeat(maxColSize)));

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

	const colNames = options.colNames || rows.map(object => Object.keys(object)).flatten().unique();
	const colNameMap = Object.merge(colNames.reduce((r, colName) => { r[colName] = colName.replace( /([A-Z])/g, " $1" ).toProperCase(); return r; }, {}), options.colNameMap || {});
	const alignmentDefault = options.alignmentDefault || "l";
	const colTypes = colNames.map(colName => { const v = rows[0][colName]; return Number.isNumber(v) ? "number" : typeof v; });
	const booleanValues = options.booleanValues || ["True", "False"];

	if(options.sorter)
		rows.sort(options.sorter);

	if(options.formatter)
		rows.forEach(object => colNames.forEach(colName => { object[colName] = options.formatter(colName, object[colName]); }));
	else
		rows.forEach(object => colNames.forEach((colName, i) => { const v=object[colName]; object[colName] = colTypes[i]==="boolean" ? booleanValues[v ? 0 : 1] : (colTypes[i]==="number" ? (typeof v==="number" ? v.toLocaleString() : 0) : v); }));

	const maxColSizeMap = {};
	rows.forEach(row => colNames.forEach(colName => { if(row.hasOwnProperty(colName)) { maxColSizeMap[colName] = Math.max((maxColSizeMap[colName] || 0), (""+row[colName]).length, colNameMap[colName].length); } }));	// eslint-disable-line curly

	rows.splice(0, 0, colNameMap, Object.map(colNameMap, k => [k, "-".repeat(maxColSizeMap[k])]));

	let result = "";

	const spacing = options.padding || 5;
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

			rowOut += col;

			if(a==="c" || a==="l")
				rowOut += " ".repeat(Math.round(colPadding/(a==="c" ? 2 : 1)));

			rowOut += " ".repeat(spacing);
		});

		result += rowOut + "\n";
	});

	return result;
};

exports.singleLineBooleanPie = function singleLineBooleanPie(o, label="Label", lineLength=120)
{
	const COLORS = [202, 134, 190, 27];
	const barLength = lineLength-(label.length+2);
	const keys = Object.keys(o);
	const values = Object.values(o);
	const TOTAL = Object.values(o).sum();

	if(keys.length===1)
		keys.push(keys[0]==="true" ? "false" : "true");
	if(values.length===1)
		values.push(0);

	// Labels
	process.stdout.write(clc.whiteBright(label) + ": ");
	process.stdout.write(clc.xterm(11)(keys[0]));
	const firstValue = " " + values[0].toLocaleString() + " (" + Math.round((values[0]/TOTAL)*100) + "%)";
	process.stdout.write(firstValue);
	const secondValue = " " + values[1].toLocaleString() + " (" + Math.round((values[1]/TOTAL)*100) + "%)";
	process.stdout.write(" ".repeat(barLength-((keys[0].length+keys[1].length+firstValue.length+secondValue.length)-1)));
	process.stdout.write(clc.xterm(11)(keys[1]));
	process.stdout.write(secondValue);
	process.stdout.write("\n");

	// Pie
	process.stdout.write(" ".repeat(label.length+1) + clc.cyanBright("["));
	values.forEach((v, i) => process.stdout.write(clc.xterm(COLORS[i])("█".repeat(barLength*(v/TOTAL)))));
	process.stdout.write(clc.cyanBright("]"));

	process.stdout.write("\n\n");
};

exports.multiLineBarChart = function multiLineBarChart(o, label="Label", lineLength=120)
{
	const COLORS = [208, 134, 47, 190, 162, 27, 250].pushCopyInPlace(10);
	const LINES = Object.entries(o).sort((a, b) => b[1]-a[1]);
	const TOTAL = Object.values(o).sum();
	const VALUES = LINES.map(line => line[1].toLocaleString() + " (" + Math.round((line[1]/TOTAL)*100) + "%)");
	const longestKey = LINES.map(line => line[0].length).sort((a, b) => b-a)[0];
	const barLength = lineLength-(longestKey+2);

	process.stdout.write(" ".repeat(Math.round((lineLength-label.length)/2)) + clc.yellowBright(label) + "\n");
	process.stdout.write(clc.cyanBright("=").repeat(lineLength) + "\n");

	LINES.forEach((LINE, i) =>
	{
		process.stdout.write(clc.whiteBright(LINE[0].padStart(longestKey)) + ": ");
		process.stdout.write(clc.xterm(COLORS[i])("█".repeat(Math.max((LINE[1] > 0 ? 1 : 0), Math.round(barLength*(LINE[1]/TOTAL))))));
		process.stdout.write(" " + VALUES[i]);
		process.stdout.write("\n");
	});

	process.stdout.write("\n");
};
