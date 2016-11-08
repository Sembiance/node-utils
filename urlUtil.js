"use strict";

var base = require("xbase"),
	querystring = require("querystring"),
	url = require("url");

exports.setQueryParam = function(targetURL, name, value)
{
	var urlObj = url.parse(targetURL);
	
	var queryObj = querystring.parse(urlObj.search.substring(1));
	queryObj[name] = value;

	urlObj.search = "?" + querystring.stringify(queryObj);
	delete urlObj.query;

	return url.format(urlObj);
};

exports.stripQuery = function(targetURL)
{
	var urlObj = url.parse(targetURL);
	urlObj.query = null;
	urlObj.search = null;
	urlObj.path = urlObj.pathname;

	return url.format(urlObj);
};