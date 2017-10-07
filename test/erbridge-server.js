"use strict";

const ERBridge = require("erbridge"),
	erBridgeUtils = require("../index").erbridge;

const bridge = new ERBridge();
bridge.on("available", () => console.log("AVAILABLE!"));
bridge.on("unavailable", () => console.log("UNAVAILABLE!"));
bridge.listen();

erBridgeUtils.registerBridge(bridge);

erBridgeUtils.handleRequest("testRequest", (err, data, cb) =>
{
	console.log(data);
	cb("testResponse", {abc : 123});
});
