"use strict";

var base = require("xbase"),
	fs = require("fs"),
	url = require("url"),
	http = require("http"),
	https = require("https"),
	streamBuffers = require("stream-buffers"),
	Agent = require("agentkeepalive"),
	tiptoe = require("tiptoe");

var keepaliveAgent = new Agent({
	maxSockets       : 100,
	maxFreeSockets   : 10,
	timeout          : 60000,
	keepAliveTimeout : 30000
});

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
		agent    : keepaliveAgent,
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
	base.info("%d B.1 %s", Date.now(), targetURL);
	var uo = url.parse(targetURL);
	var requestOptions =
	{
		hostname : uo.hostname,
		port     : uo.port || (targetURL.startsWith("https") ? 443 : 80),
		method   : "GET",
		path     : uo.path,
		agent    : keepaliveAgent,
		headers  : getHeaders(extraHeaders)
	};
	base.info("%d B.2", Date.now());
	var responseData = new streamBuffers.WritableStreamBuffer();
	var httpResponse = function(response)
	{
		response.on("data", function(d) { base.info("%d B.3", Date.now()); responseData.write(d); });
		response.on("end", function() { base.info("%d B.4", Date.now()); cb(undefined, responseData.getContents(), response.statusCode); });
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
		"accept-language" : "en-US,en;q=0.8,fil;q=0.6",
		"cache-control"   : "no-cache",
		"pragma"          : "no-cache",
		"user-agent"      : "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.16 Safari/537.36"
	};

	return Object.merge(headers, extraHeaders || {});
}
