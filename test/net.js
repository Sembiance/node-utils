"use strict";

const XU = require("@sembiance/xu"),
	assert = require("assert"),
	net = require("net"),
	netUtil = require("../index").net;

const server = new net.Server();
let listening = false;

netUtil.waitForConnection("127.0.0.1", 32523, err =>
{
	assert(!err);
	assert(listening);
	server.close(() => process.exit(0));
});

setTimeout(() =>
{
	console.error("FAILED TO CONNECT, NOT GOOD");
	process.exit(1);
}, XU.SECOND*5);

setTimeout(() =>
{
	listening = true;
	server.listen(32523, "127.0.0.1");
}, XU.SECOND*2);
