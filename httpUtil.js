"use strict";

const XU = require("@sembiance/xu"),
	fs = require("fs"),
	url = require("url"),
	path = require("path"),
	fileUtil = require("./fileUtil.js"),
	http = require("http"),
	https = require("https"),
	querystring = require("querystring"),
	crypto = require("crypto"),
	urlencode = require("urlencode"),
	streamBuffers = require("stream-buffers");

function getHeaders(extraHeaders)
{
	const headers =
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
	const uo = new url.URL(targetURL);
	const requestOptions =
	{
		hostname : uo.hostname,
		port     : uo.port || (targetURL.startsWith("https") ? 443 : 80),
		method   : options.method,
		path     : decodeURIComponent(uo.pathname).split("/").map(s => (!s || !s.length ? "" : urlencode(s))).join("/") + (uo.search ? uo.search : ""),
		headers  : getHeaders(options.headers)
	};

	requestOptions.headers.Host = requestOptions.hostname;

	if(options.method==="HEAD")
		requestOptions.agent = false;

	if(options.username && options.password)
		requestOptions.headers.Authorization = "Basic " + Buffer.from(options.username + ":" + options.password).toString("base64");

	if(options.postData)
	{
		requestOptions.headers["Content-Type"] = options.contentType || "application/x-www-form-urlencoded";
		requestOptions.headers["Content-Length"] = Buffer.byteLength(options.postData, "utf8");
	}

	let httpRequest = null;
	let timeoutid = options.timeout ? setTimeout(() => { timeoutid = undefined; httpRequest.abort(); }, options.timeout) : undefined;
	const httpClearTimeout = function() { if(timeoutid!==undefined) { clearTimeout(timeoutid); timeoutid = undefined; } };
	const responseData = options.method!=="HEAD" ? new streamBuffers.WritableStreamBuffer() : undefined;
	const outputFile = options.download ? fs.createWriteStream(options.download) : undefined;

	const httpResponse = function httpResponse(response)
	{
		// DO: Add support for 302 redirect
		if(response.statusCode===301 || response.statusCode===302)
		{
			httpClearTimeout();

			if(options.download)
				outputFile.close();

			return httpExecute((response.headers.location.startsWith("http") ? "" : ("http" + (targetURL.startsWith("https") ? "s" : "") + "://" + uo.host)) + response.headers.location, options, cb);
		}

		if(options.method==="HEAD")
		{
			setImmediate(() => { httpClearTimeout(); cb(undefined, response.headers, response.statusCode); });
		}
		else if(options.download)
		{
			response.pipe(outputFile);
			outputFile.on("finish", () => { httpClearTimeout(); setImmediate(() => cb(undefined, response.headers, response.statusCode)); });
		}
		else
		{
			response.on("data", d => responseData.write(d));
			response.on("end", () => { httpClearTimeout(); setImmediate(() => cb(undefined, responseData.getContents(), response.headers, response.statusCode)); });
		}
	};

	httpRequest = (targetURL.startsWith("https") ? https : http).request(requestOptions, httpResponse);

	httpRequest.on("error", err =>
	{
		httpClearTimeout();
		if(outputFile)
		{
			outputFile.end();
			fs.unlinkSync(options.download);
		}

		if(options.retry && options.retry>=1)
		{
			//console.error("RETRYING %s", targetURL);
			options = XU.clone(options);	// eslint-disable-line no-param-reassign
			options.retry = options.retry-1;
			httpExecute(targetURL, options, cb);
		}
		else
		{
			cb(err);	// eslint-disable-line callback-return
		}
	});

	if(options.postData)
		httpRequest.write(options.postData, "utf8");
	
	httpRequest.end();
}

exports.download = download;
function download(targetURL, destination, _options, cb)
{
	const options = XU.clone(!cb ? {} : _options);
	options.method = "GET";
	options.download = destination;

	return httpExecute(targetURL, options, cb || _options);
}

exports.head = head;
function head(targetURL, _options, cb)
{
	const options = XU.clone(!cb ? {} : _options);
	options.method = "HEAD";

	return httpExecute(targetURL, options, cb || _options);
}

exports.get = get;
function get(targetURL, _options, _cb)
{
	const options = XU.clone(!_cb ? {} : _options);
	options.method = "GET";

	let cb = _cb;

	let cachePath = "";
	if(_options.cacheBase)
	{
		const hash = crypto.createHash("sha256");
		hash.update(targetURL, "utf8");
		cachePath = path.join(_options.cacheBase, hash.digest("base64"));
		if(fileUtil.existsSync(cachePath))
			return fs.readFile(cachePath, XU.UTF8, cb);
	}

	if(cachePath)
	{
		if(options.verbose)
			console.log("Cache miss: %s vs %s", targetURL, cachePath);

		cb = function(err, data, headers, statusCode)
		{
			if(err || !data)
				return _cb(err, data, headers, statusCode);

			fs.writeFile(cachePath, data, XU.UTF8, fileErr => _cb(fileErr, data, headers, statusCode));
		};
	}

	return httpExecute(targetURL, options, cb || _options);
}
exports.post = post;
function post(targetURL, postData, _options, cb)
{
	const options = XU.clone(!cb ? {} : _options);
	options.method = "POST";
	options.postData = querystring.stringify(postData);

	return httpExecute(targetURL, options, cb || _options);
}

exports.put = put;
function put(targetURL, putData, _options, cb)
{
	const options = XU.clone(!cb ? {} : _options);
	options.method = "PUT";
	options.contentType = (typeof putData==="string" || putData instanceof Buffer) ? "text/plain" : "application/json";
	options.postData = typeof putData==="string" ? putData : (putData instanceof Buffer ? putData.toString("utf8") : JSON.stringify(putData));

	return httpExecute(targetURL, options, cb || _options);
}
