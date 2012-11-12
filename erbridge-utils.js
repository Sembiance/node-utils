"use strict";

var uuid = require("node-uuid");

var requestCallbacks = {};
var requestHandlers = {};

function messageHandler(bridge, messageName, messageData, requestid, socketid)
{
	if(requestCallbacks.hasOwnProperty(requestid))
	{
		requestCallbacks[requestid](messageName, messageData);
		delete requestCallbacks[requestid];
	}
	else if(requestHandlers.hasOwnProperty(messageName))
	{
		requestHandlers[messageName](messageData, function(responseName, responseData) { bridge.send("request", [responseName, responseData, requestid], socketid); });
	}
}

exports.registerBridge = function(bridge)
{
	bridge.on("message_request", function(message, socketid) { messageHandler(bridge, message[0], message[1], message[2], socketid); });
};

exports.sendRequest = function(bridge, messageName, messageData, cb, socketid)
{
	var requestid = uuid.v4();
	requestCallbacks[requestid] = cb;
	
	bridge.send("request", [messageName, messageData, requestid], (socketid || undefined));
};

exports.handleRequest = function(messageName, cb)
{
	requestHandlers[messageName] = cb;
};
