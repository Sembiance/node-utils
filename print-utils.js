"use strict";

var base = require("node-base");

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
	var colNameMap = options.colNameMap || colNames.mutate(function(colName, r) { r[colName] = colName.toProperCase(); return r; }, {});

	if(options.sorter)
		rows.sort(options.sorter);

	if(options.formatter)
		rows.forEach(function(object) { Object.forEach(object, function(k, v) { object[k] = options.formatter(k, v); }); });

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
			var col = row[colName];
			var a = rowNum===0 ? "c" : (options.alignment ? (options.alignment[colName] || "l") : "l");
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