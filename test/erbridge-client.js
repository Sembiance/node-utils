"use strict";

var ERBridge = require("erbridge"),
	erBridgeUtils = require("../index").erbridge;

var bridge = new ERBridge();
bridge.on("available", function(b) { console.log("AVAILABLE!"); });
bridge.on("unavailable", function(b) { console.log("UNAVAILABLE!"); });
bridge.connect();

erBridgeUtils.registerBridge(bridge);

erBridgeUtils.sendRequest(bridge, "testRequest", {foo:"bar"}, function(err, name, data)
{
	console.log("got response %s with data %o", name, data);
});
