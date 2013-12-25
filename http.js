"use strict";

var base = require("xbase"),
	fs = require("fs"),
	url = require("url"),
	http = require("http"),
	tiptoe = require("tiptoe");

exports.download = download;
function download(targetURL, destination, extraHeaders, cb)
{
	cb = cb || extraHeaders;
	extraHeaders = (!cb ? {} : extraHeaders);
	var headers =
	{
		"accept"          : "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
		"accept-charset"  : "ISO-8859-1,utf-8;q=0.7,*;q=0.3",
		"accept-language" : "en-US,en;q=0.8",
		"user-agent"      : "Mozilla/5.0 (X11; Linux i686) AppleWebKit/536.11 (KHTML, like Gecko) Chrome/20.0.1132.47 Safari/536.11"
	};


	var uo = url.parse(targetURL);
	var requestOptions =
	{
		hostname : uo.hostname,
		port     : uo.port || 80,
		method   : "GET",
		path     : uo.path,
		headers  : Object.merge(headers, extraHeaders)
	};

	var file = fs.createWriteStream(destination);
	http.get(requestOptions, function(response)
	{
		response.pipe(file);
		file.on("finish", function() { file.close(); setImmediate(cb); });
	});
}
