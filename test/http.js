"use strict";

var assert = require("assert"),
	httpUtil = require("../index").http;

/*httpUtil.head("http://dev.mtgimage.com/card/azorius æthermage.hq.jpg", function(err, response, statusCode)
{
	console.log(arguments);
});*/

httpUtil.head("http://httpbin.org/delay/10", {timeout:5000}, function(err, responseHeaders, statusCode)
{
	assert(err);
});

httpUtil.get("http://httpbin.org/delay/10", {timeout:5000}, function(err, responseData, statusCode)
{
	assert(err);
});

httpUtil.head("http://httpbin.org/delay/10", function(err, responseHeaders, statusCode)
{
	assert(!err);
	assert.equal(statusCode, 200);
});

httpUtil.get("http://httpbin.org/bytes/1024", function(err, responseData, responseHeaders, statusCode)
{
	assert(!err);
	assert.strictEqual(+responseHeaders["content-length"], 1024);
});
