"use strict";

var base = require("node-base");

var categories =
{
	letter      : ["Ll", "Lm", "Lo", "Lt", "Lu"],
	number      : ["Nd", "Nl", "No"],
	punctuation : ["Pc","Pd", "Pe", "Pf", "Pi", "Po", "Ps"],
	mark        : ["Mc", "Me", "Mn"],
	symbol      : ["Sc", "Sk", "Sm", "So"],
	space       : ["Zs"],
	other       : ["Cc", "Cf", "Co", "Cs"]	// Cn
};

var categoryData = Object.map(categories, function(categoryName, categorySymbols)
{
	var data = categorySymbols.mutate(function(categorySymbol, r)
	{
		return Object.merge(r, require("unicode/category/" + categorySymbol));
	}, {});

	return [categoryName, data];
});

// letter, number, punctuation, mark, symbol, space, other, unknown
exports.getCategories = function(s)
{
	var result = [];
	for(var i=0,len=s.length;i<len;i++)
	{
		result.push(getCharCodeCategory(s.charCodeAt(i)));
	}

	return result;
};

exports.getCategory = function(charOrCharCode)
{
	return getCharCodeCategory(typeof charOrCharCode==="number" ? charOrCharCode : charOrCharCode.charCodeAt(0));
};

function getCharCodeCategory(charCode)
{
	var result;

	Object.forEach(categoryData, function(categoryName, data)
	{
		if(result)
			return;

		if(data[charCode])
			result = categoryName;
	});

	return result || "unknown";
}

function categorySymbolToName(categorySymbol)
{
	var result;

	Object.forEach(categories, function(categoryName, categorySymbols)
	{
		if(result)
			return;

		if(categorySymbols.contains(categorySymbol))
			result = categoryName;
	});

	return result;
}