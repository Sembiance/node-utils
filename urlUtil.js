"use strict";

const base = require("@sembiance/xbase"),
	querystring = require("querystring"),
	url = require("url");

exports.setQueryParams = function setQueryParams(targetURL, nameValues)
{
	Object.forEach(nameValues, (name, value) => { targetURL = exports.setQueryParam(targetURL, name, value); });	// eslint-disable-line no-param-reassign
	return targetURL;
};

exports.setQueryParam = function setQueryParam(targetURL, name, value)
{
	const urlObj = url.parse(targetURL);
	
	const queryObj = querystring.parse(urlObj.search.substring(1));
	queryObj[name] = value;

	urlObj.search = "?" + querystring.stringify(queryObj);
	delete urlObj.query;

	return url.format(urlObj);
};

exports.stripQuery = function stripQuery(targetURL)
{
	const urlObj = url.parse(targetURL);
	urlObj.query = null;
	urlObj.search = null;
	urlObj.path = urlObj.pathname;

	return url.format(urlObj);
};
