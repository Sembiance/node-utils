"use strict";

var base = require("xbase"),
	fs = require("fs"),
	url = require("url"),
	http = require("http"),
	https = require("https"),
	streamBuffers = require("stream-buffers"),
	tiptoe = require("tiptoe");

exports.download = download;
function download(targetURL, destination, _extraHeaders, cb)
{
	var extraHeaders = (!cb ? {} : _extraHeaders);
	cb = cb || _extraHeaders;

	var uo = url.parse(targetURL);
	var requestOptions =
	{
		hostname : uo.hostname,
		port     : uo.port || (targetURL.startsWith("https") ? 443 : 80),
		method   : "GET",
		path     : uo.path,
		headers  : getHeaders(extraHeaders)
	};

	var file = fs.createWriteStream(destination);
	var httpResponse = function(response)
	{
		response.pipe(file);
		file.on("finish", function() { file.close(); setImmediate(cb); });
	};
	var httpRequest = (targetURL.startsWith("https") ? https : http).get(requestOptions, httpResponse);
	httpRequest.on("error", function(err) { cb(err); });
}

exports.get = get;
function get(targetURL, _extraHeaders, cb)
{
	var extraHeaders = (!cb ? {} : _extraHeaders);
	cb = cb || _extraHeaders;

	var uo = url.parse(targetURL);
	var requestOptions =
	{
		hostname : uo.hostname,
		port     : uo.port || (targetURL.startsWith("https") ? 443 : 80),
		method   : "GET",
		path     : uo.path,
		headers  : getHeaders(extraHeaders)
	};

	var responseData = new streamBuffers.WritableStreamBuffer();
	var httpResponse = function(response)
	{
		response.on("data", function(d) { responseData.write(d); });
		response.on("end", function() { cb(undefined, responseData.getContents(), response.statusCode); });
	};
	var httpRequest = (targetURL.startsWith("https") ? https : http).get(requestOptions, httpResponse);
	httpRequest.on("error", function(err) { cb(err); });
}

exports.head = head;
function head(targetURL, _extraHeaders, cb)
{
	var extraHeaders = (!cb ? {} : _extraHeaders);
	cb = cb || _extraHeaders;

	var uo = url.parse(targetURL);
	var requestOptions =
	{
		hostname : uo.hostname,
		port     : uo.port || (targetURL.startsWith("https") ? 443 : 80),
		method   : "HEAD",
		path     : uo.path,
		agent    : false,
		headers  : getHeaders(extraHeaders)
	};

	var httpResponse = function(response)
	{
		setImmediate(function() { cb(undefined, response.headers, response.statusCode); });
	};
	var httpRequest = (targetURL.startsWith("https") ? https : http).request(requestOptions, httpResponse);
	httpRequest.on("error", function(err) { cb(err); });
	httpRequest.end();
}

function getHeaders(extraHeaders)
{
	var headers =
	{
		"accept"          : "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
		"accept-charset"  : "ISO-8859-1,utf-8;q=0.7,*;q=0.3",
		"accept-language" : "en-US,en;q=0.8",
		"user-agent"      : "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.69 Safari/537.36"
	};

	return Object.merge(headers, extraHeaders || {});
}
