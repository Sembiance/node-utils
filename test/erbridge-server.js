"use strict";

var ERBridge = require("erbridge"),
	erBridgeUtils = require("../index").erbridge;

var bridge = new ERBridge();
bridge.on("available", function(b) { console.log("AVAILABLE!"); });
bridge.on("unavailable", function(b) { console.log("UNAVAILABLE!"); });
bridge.listen();

erBridgeUtils.registerBridge(bridge);

erBridgeUtils.handleRequest("testRequest", function(err, data, cb)
{
	console.log(data);
	cb("testResponse", {abc:123});
});
