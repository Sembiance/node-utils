"use strict";

var base = require("@sembiance/xbase"),
	fs = require("fs"),
	url = require("url"),
	http = require("http"),
	https = require("https"),
	querystring = require("querystring"),
	urlencode = require("urlencode"),
	streamBuffers = require("stream-buffers");

function getHeaders(extraHeaders)
{
	var headers =
	{
		"Accept"          : "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
		"Accept-Charset"  : "ISO-8859-1,utf-8;q=0.7,*;q=0.3",
		"Accept-Language" : "en-US,en;q=0.8,fil;q=0.6",
		"Cache-Control"   : "no-cache",
		"Pragma"          : "no-cache",
		"User-Agent"      : "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.16 Safari/537.36"
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
		path     : decodeURIComponent(uo.pathname).split("/").map(function(s) { return !s || !s.length ? "" : urlencode(s); }).join("/") + (uo.search ? uo.search : ""),
		headers  : getHeaders(options.headers)
	};

	requestOptions.headers.Host = requestOptions.hostname;

	if(options.method==="HEAD")
		requestOptions.agent = false;

	if(options.username && options.password)
		requestOptions.headers.Authorization = "Basic " + new Buffer(options.username + ":" + options.password).toString("base64");

	if(options.postData)
	{
		requestOptions.headers["Content-Type"] = options.contentType || "application/x-www-form-urlencoded";
		requestOptions.headers["Content-Length"] = Buffer.byteLength(options.postData, "utf8");
	}

	var timeoutid = options.timeout ? setTimeout(function() { timeoutid = undefined; httpRequest.abort(); }, options.timeout) : undefined;
	var httpClearTimeout = function() { if(timeoutid!==undefined) { clearTimeout(timeoutid); timeoutid = undefined; } };
	var responseData = options.method!=="HEAD" ? new streamBuffers.WritableStreamBuffer() : undefined;
	var outputFile = options.download ? fs.createWriteStream(options.download) : undefined;

	var httpResponse = function(response)
	{
		if(options.method==="HEAD")
		{
			setImmediate(function() {
				httpClearTimeout();
				cb(undefined, response.headers, response.statusCode);
			});
		}
		else if(options.download)
		{
			response.pipe(outputFile);
			outputFile.on("finish", function() { httpClearTimeout(); outputFile.close(); setImmediate(function() { cb(undefined, response.headers, response.statusCode); }); });
		}
		else
		{
			response.on("data", function(d) { responseData.write(d); });
			response.on("end", function() { httpClearTimeout(); setImmediate(function() { cb(undefined, responseData.getContents(), response.headers, response.statusCode); }); });
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

		if(options.retry && options.retry>=1)
		{
			//base.error("RETRYING %s", targetURL);
			options = base.clone(options);
			options.retry = options.retry-1;
			httpExecute(targetURL, options, cb);
		}
		else
		{
			cb(err);
		}
	});

	if(options.postData)
		httpRequest.write(options.postData, "utf8");
	
	httpRequest.end();
}

exports.download = download;
function download(targetURL, destination, _options, cb)
{
	var options = base.clone(!cb ? {} : _options);
	options.method = "GET";
	options.download = destination;

	return httpExecute(targetURL, options, cb || _options);
}

exports.head = head;
function head(targetURL, _options, cb)
{
	var options = base.clone(!cb ? {} : _options);
	options.method = "HEAD";

	return httpExecute(targetURL, options, cb || _options);
}

exports.get = get;
function get(targetURL, _options, cb)
{
	var options = base.clone(!cb ? {} : _options);
	options.method = "GET";

	return httpExecute(targetURL, options, cb || _options);
}
exports.post = post;
function post(targetURL, postData, _options, cb)
{
	var options = base.clone(!cb ? {} : _options);
	options.method = "POST";
	options.postData = querystring.stringify(postData);

	return httpExecute(targetURL, options, cb || _options);
}

exports.put = put;
function put(targetURL, putData, _options, cb)
{
	var options = base.clone(!cb ? {} : _options);
	options.method = "PUT";
	options.contentType = (typeof putData==="string" || putData instanceof Buffer) ? "text/plain" : "application/json";
	options.postData = typeof putData==="string" ? putData : (putData instanceof Buffer ? putData.toString("utf8") : JSON.stringify(putData));

	return httpExecute(targetURL, options, cb || _options);
}
