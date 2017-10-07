"use strict";

const ERBridge = require("erbridge"),
	erBridgeUtils = require("../index").erbridge;

const bridge = new ERBridge();
bridge.on("available", () => console.log("AVAILABLE!"));
bridge.on("unavailable", () => console.log("UNAVAILABLE!"));
bridge.connect();

erBridgeUtils.registerBridge(bridge);

erBridgeUtils.sendRequest(bridge, "testRequest", {foo : "bar"}, (err, name, data) => console.log("got response %s with data %o", name, data));
