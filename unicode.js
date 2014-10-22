"use strict";

var base = require("xbase");

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

var UNICODE_CONVERSION_MAP =
{
	// latin
	'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A', 'Æ': 'AE',
	'Ç': 'C', 'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E', 'Ì': 'I', 'Í': 'I',
	'Î': 'I', 'Ï': 'I', 'Ð': 'D', 'Ñ': 'N', 'Ò': 'O', 'Ó': 'O', 'Ô': 'O',
	'Õ': 'O', 'Ö': 'O', 'Ő': 'O', 'Ø': 'O', 'Ù': 'U', 'Ú': 'U', 'Û': 'U',
	'Ü': 'U', 'Ű': 'U', 'Ý': 'Y', 'Þ': 'TH', 'ß': 'ss', 'à':'a', 'á':'a',
	'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'ae', 'ç': 'c', 'è': 'e',
	'é': 'e', 'ê': 'e', 'ë': 'e', 'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
	'ð': 'd', 'ñ': 'n', 'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
	'ő': 'o', 'ø': 'o', 'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u', 'ű': 'u',
	'ý': 'y', 'þ': 'th', 'ÿ': 'y', 'ẞ': 'SS',
	// greek
	'α':'a', 'β':'b', 'γ':'g', 'δ':'d', 'ε':'e', 'ζ':'z', 'η':'h', 'θ':'8',
	'ι':'i', 'κ':'k', 'λ':'l', 'μ':'m', 'ν':'n', 'ξ':'3', 'ο':'o', 'π':'p',
	'ρ':'r', 'σ':'s', 'τ':'t', 'υ':'y', 'φ':'f', 'χ':'x', 'ψ':'ps', 'ω':'w',
	'ά':'a', 'έ':'e', 'ί':'i', 'ό':'o', 'ύ':'y', 'ή':'h', 'ώ':'w', 'ς':'s',
	'ϊ':'i', 'ΰ':'y', 'ϋ':'y', 'ΐ':'i',
	'Α':'A', 'Β':'B', 'Γ':'G', 'Δ':'D', 'Ε':'E', 'Ζ':'Z', 'Η':'H', 'Θ':'8',
	'Ι':'I', 'Κ':'K', 'Λ':'L', 'Μ':'M', 'Ν':'N', 'Ξ':'3', 'Ο':'O', 'Π':'P',
	'Ρ':'R', 'Σ':'S', 'Τ':'T', 'Υ':'Y', 'Φ':'F', 'Χ':'X', 'Ψ':'PS', 'Ω':'W',
	'Ά':'A', 'Έ':'E', 'Ί':'I', 'Ό':'O', 'Ύ':'Y', 'Ή':'H', 'Ώ':'W', 'Ϊ':'I',
	'Ϋ':'Y',
	// turkish
	'ş':'s', 'Ş':'S', 'ı':'i', 'İ':'I', 'ğ':'g', 'Ğ':'G',
	// russian
	'а':'a', 'б':'b', 'в':'v', 'г':'g', 'д':'d', 'е':'e', 'ё':'yo', 'ж':'zh',
	'з':'z', 'и':'i', 'й':'j', 'к':'k', 'л':'l', 'м':'m', 'н':'n', 'о':'o',
	'п':'p', 'р':'r', 'с':'s', 'т':'t', 'у':'u', 'ф':'f', 'х':'h', 'ц':'c',
	'ч':'ch', 'ш':'sh', 'щ':'sh', 'ъ':'u', 'ы':'y', 'ь':'', 'э':'e', 'ю':'yu',
	'я':'ya',
	'А':'A', 'Б':'B', 'В':'V', 'Г':'G', 'Д':'D', 'Е':'E', 'Ё':'Yo', 'Ж':'Zh',
	'З':'Z', 'И':'I', 'Й':'J', 'К':'K', 'Л':'L', 'М':'M', 'Н':'N', 'О':'O',
	'П':'P', 'Р':'R', 'С':'S', 'Т':'T', 'У':'U', 'Ф':'F', 'Х':'H', 'Ц':'C',
	'Ч':'Ch', 'Ш':'Sh', 'Щ':'Sh', 'Ъ':'U', 'Ы':'Y', 'Ь':'', 'Э':'E', 'Ю':'Yu',
	'Я':'Ya',
	// ukranian
	'Є':'Ye', 'І':'I', 'Ї':'Yi', 'Ґ':'G', 'є':'ye', 'і':'i', 'ї':'yi', 'ґ':'g',
	// czech
	'č':'c', 'ď':'d', 'ě':'e', 'ň': 'n', 'ř':'r', 'š':'s', 'ť':'t', 'ů':'u',
	'ž':'z', 'Č':'C', 'Ď':'D', 'Ě':'E', 'Ň': 'N', 'Ř':'R', 'Š':'S', 'Ť':'T',
	'Ů':'U', 'Ž':'Z',
	// polish
	'ą':'a', 'ć':'c', 'ę':'e', 'ł':'l', 'ń':'n', 'ś':'s', 'ź':'z',
	'ż':'z', 'Ą':'A', 'Ć':'C', 'Ę':'e', 'Ł':'L', 'Ń':'N', 'Ś':'S',
	'Ź':'Z', 'Ż':'Z',
	// latvian
	'ā':'a', 'ē':'e', 'ģ':'g', 'ī':'i', 'ķ':'k', 'ļ':'l', 'ņ':'n', 'ū':'u',
	'Ā':'A', 'Ē':'E', 'Ģ':'G', 'Ī':'i', 'Ķ':'k', 'Ļ':'L', 'Ņ':'N', 'Ū':'u'
};

exports.unicodeToAscii = function(text, additionalSymbols)
{
	var result = "";
	var CONVERSION_MAP = Object.merge(UNICODE_CONVERSION_MAP, (additionalSymbols || {}));

	for(var i=0,len=text.length;i<len;i++)
	{
		var c = text.charAt(i);
		result += CONVERSION_MAP.hasOwnProperty(c) ? CONVERSION_MAP[c] : c;
	}

	return result;
};