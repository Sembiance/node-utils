"use strict";

const XU = require("@sembiance/xu"),
	net = require("net");

exports.waitForConnection = function waitForConnection(host, port, cb)
{
	const sock = new net.Socket();
	sock.on("error", err => setTimeout(() => sock.connect(port, host), 50));
	sock.on("connect", () => sock.end(undefined, undefined, cb));
	
	sock.connect(port, host);
};
