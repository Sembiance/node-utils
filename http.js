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
	keepAlive        : true,
	maxSockets       : 100,
	maxFreeSockets   : 100,
	timeout          : 60000,
	keepAliveTimeout : 30000
});

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

function httpExecute(targetURL, options, cb)
{
	var uo = url.parse(targetURL);
	var requestOptions =
	{
		hostname : uo.hostname,
		port     : uo.port || (targetURL.startsWith("https") ? 443 : 80),
		method   : options.method,
		path     : uo.path,
		agent    : false,
		headers  : getHeaders(options.headers)
	};

	if(options.method==="GET")
		requestOptions.agent = keepaliveAgent;

	var timeoutid = options.timeout ? setTimeout(function() { timeoutid = undefined; httpRequest.abort(); }, options.timeout) : undefined;
	var httpClearTimeout = function() { if(timeoutid!==undefined) { clearTimeout(timeoutid); timeoutid = undefined; } };
	var responseData = options.method==="GET" ? new streamBuffers.WritableStreamBuffer() : undefined;
	var outputFile = options.download ? fs.createWriteStream(options.download) : undefined;

	var httpResponse = function(response)
	{
		if(options.download)
		{
			response.pipe(outputFile);
			outputFile.on("finish", function() { httpClearTimeout(); outputFile.close(); setImmediate(function() { cb(undefined, response.headers, response.statusCode); }); });
		}
		else if(options.method==="GET")
		{
			response.on("data", function(d) { responseData.write(d); });
			response.on("end", function() { httpClearTimeout(); setImmediate(function() { cb(undefined, responseData.getContents(), response.headers, response.statusCode); }); });
		}
		else if(options.method==="HEAD")
		{
			setImmediate(function() {
				httpClearTimeout();
				cb(undefined, response.headers, response.statusCode);
			});
		}
	};

	var httpRequest = (targetURL.startsWith("https") ? https : http).request(requestOptions, httpResponse);

	httpRequest.on("error", function(err) {
		httpClearTimeout();
		if(outputFile)
		{
			outputFile.close();
			fs.unlinkSync(options.download);
		}
		cb(err);
	});

	httpRequest.end();
}

exports.download = download;
function download(targetURL, destination, _options, cb)
{
	var options = (!cb ? {} : _options);
	options.method = "GET";
	options.download = destination;

	return httpExecute(targetURL, options, cb || _options);
}

exports.head = head;
function head(targetURL, _options, cb)
{
	var options = (!cb ? {} : _options);
	options.method = "HEAD";

	return httpExecute(targetURL, options, cb || _options);
}

exports.get = get;
function get(targetURL, _options, cb)
{
	var options = (!cb ? {} : _options);
	options.method = "GET";

	return httpExecute(targetURL, options, cb || _options);
}
