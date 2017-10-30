"use strict";

const base = require("@sembiance/xbase"),
	assert = require("assert"),
	fs = require("fs"),
	path = require("path"),
	httpUtil = require("../index").http;

/*httpUtil.head("http://dev.mtgimage.com/card/azorius æthermage.hq.jpg", function(err, response, statusCode)
{
	console.log(arguments);
});*/


httpUtil.download("http://movietrailers.apple.com/movies/independent/11-8-16/11-8-16-trailer-1_h1080p.mov", "/tmp/out", {headers : {"user-agent" : "QuickTime/7.6.2"}}, base.FINISH);

/*
httpUtil.head("http://httpbin.org/delay/10", {timeout : 5000}, err => assert(err));

httpUtil.get("http://httpbin.org/delay/10", {timeout : 5000}, err => assert(err));

httpUtil.download("http://httpbin.org/delay/10", "/tmp/httpDelayTest", {timeout : 5000}, err =>
{
	assert(err);
	assert(!fs.existsSync("/tmp/httpDelayTest"));
});

httpUtil.head("http://httpbin.org/delay/10", (err, responseHeaders, statusCode) =>
{
	assert(!err);
	assert.equal(statusCode, 200);
});

httpUtil.get("http://httpbin.org/bytes/1024", (err, responseData, responseHeaders) =>
{
	assert(!err);
	assert.strictEqual(+responseHeaders["content-length"], 1024);
});

httpUtil.head("http://httpbin.org/delay/10", {timeout : 5000, retry : 3}, err => assert(err));

httpUtil.post("http://httpbin.org/post", {custtel : "555-867-5309"}, (err, responseData) => assert.strictEqual(JSON.parse(responseData.toString("utf8")).form.custtel, "555-867-5309"));

httpUtil.put("http://httpbin.org/put", {abc : 123, love : true}, (err, responseData) => assert.strictEqual(JSON.parse(JSON.parse(responseData.toString("utf8")).data).abc, 123));

httpUtil.put("http://httpbin.org/put", "hello world!", (err, responseData) => assert.strictEqual(JSON.parse(responseData.toString("utf8")).data, "hello world!"));

httpUtil.put("http://httpbin.org/put", fs.readFileSync(path.join(__dirname, "testPUTData")), (err, responseData) => assert.strictEqual(JSON.parse(responseData.toString("utf8")).data, "hello world!\n"));
*/