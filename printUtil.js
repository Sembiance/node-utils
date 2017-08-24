"use strict";

var base = require("@sembiance/xbase"),
	accounting = require("accounting");

exports.toSize = function(num, precision)
{
	precision = typeof precision==="undefined" ? 1 : precision;

	if(num<base.KB)
		return accounting.formatNumber(num) + " bytes";
	else if(num<base.MB)
		return accounting.formatNumber((num/base.KB), precision) + "KB";
	else if(num<base.GB)
		return accounting.formatNumber((num/base.MB), precision) + "MB";
	else if(num<base.TB)
		return accounting.formatNumber((num/base.GB), precision) + "GB";
	else if(num<base.PB)
		return accounting.formatNumber((num/base.TB), precision) + "TB";
};

exports.columnizeObject = function(o, options)
{
	options = options || {};

	var rows = Object.mutate(o, function(k, v, r) { r.push([k, v]); return r; }, []);
	if(options.sorter)
		rows.sort(options.sorter);

	if(options.formatter)
		rows = rows.map(options.formatter);

	if(options.header)
		rows.splice(0, 0, options.header);

	if(options.alignment)
		options.alignment = options.alignment.map(function(a) { return a.substring(0, 1).toLowerCase(); });

	var maxColSizes = [];
	rows.forEach(function(row) { row.forEach(function(col, i) { maxColSizes[i] = Math.max((maxColSizes[i] || 0), (""+col).length); }); });

	if(options.header)
		rows.splice(1, 0, maxColSizes.map(function(maxColSize) { return "-".repeat(maxColSize); }));

	var result = "";

	var spacing = options.padding || 5;
	rows.forEach(function(row, rowNum)
	{
		var rowOut = "";
		row.forEach(function(col, i)
		{
			col = "" + col;
			
			var a = (options.header && rowNum===0) ? "c" : (options.alignment ? (options.alignment[i] || "l") : "l");
			var colPadding = maxColSizes[i] - col.length;

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

exports.columnizeObjects = function(objects, options)
{
	options = options || {};

	var rows = base.clone(objects, true);

	var colNames = options.colNames || rows.map(function(object) { return Object.keys(object); }).flatten().unique();
	var colNameMap = Object.merge(colNames.mutate(function(colName, r) { r[colName] = colName.replace( /([A-Z])/g, " $1" ).toProperCase(); return r; }, {}), options.colNameMap || {});
	var alignmentDefault = options.alignmentDefault || "l";
	var colTypes = colNames.map(function(colName) { var v = rows[0][colName]; return Number.isNumber(v) ? "number" : typeof v; });
	var booleanValues = options.booleanValues || ["True","False"];

	if(options.sorter)
		rows.sort(options.sorter);

	if(options.formatter)
		rows.forEach(function(object) { colNames.forEach(function(colName) { object[colName] = options.formatter(colName, object[colName]); }); });
	else
		rows.forEach(function(object) { colNames.forEach(function(colName, i) { var v=object[colName]; object[colName] = colTypes[i]==="boolean" ? booleanValues[v ? 0 : 1] : (colTypes[i]==="number" && typeof v==="number" ? v.formatWithCommas() : v); }); });

	var maxColSizeMap = {};
	rows.forEach(function(row) { colNames.forEach(function(colName) { if(row.hasOwnProperty(colName)) { maxColSizeMap[colName] = Math.max((maxColSizeMap[colName] || 0), (""+row[colName]).length, colNameMap[colName].length); } }); });

	rows.splice(0, 0, colNameMap, Object.map(colNameMap, function(k, v) { return [k, "-".repeat(maxColSizeMap[k])]; }));

	var result = "";

	var spacing = options.padding || 5;
	rows.forEach(function(row, rowNum)
	{
		var rowOut = "";
		colNames.forEach(function(colName, i)
		{
			var col = "" + row[colName];
			var a = rowNum===0 ? "c" : (options.alignment ? (options.alignment[colName] || alignmentDefault) : (colTypes[i]==="number" ? "r" : (colTypes[i]==="boolean" ? "c" : alignmentDefault)));
			var colPadding = maxColSizeMap[colName] - col.length;

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
