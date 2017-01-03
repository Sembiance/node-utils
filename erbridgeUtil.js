"use strict";

var uuid = require("uuid/v4");

var requestCallbacks = {};
var requestHandlers = {};

function messageHandler(bridge, messageName, messageData, requestid, socketid)
{
	if(requestCallbacks.hasOwnProperty(requestid))
	{
		requestCallbacks[requestid](undefined, messageName, messageData);
		delete requestCallbacks[requestid];
	}
	else if(requestHandlers.hasOwnProperty(messageName))
	{
		requestHandlers[messageName](undefined, messageData, function(responseName, responseData) { bridge.send("request", [responseName, responseData, requestid], socketid); });
	}
}

exports.registerBridge = function(bridge)
{
	bridge.on("message_request", function(message, socketid) { messageHandler(bridge, message[0], message[1], message[2], socketid); });
};

exports.sendRequest = function(bridge, messageName, messageData, cb, socketid)
{
	var requestid = uuid();
	requestCallbacks[requestid] = cb;
	
	bridge.send("request", [messageName, messageData, requestid], (socketid || undefined));
};

exports.handleRequest = function(messageName, cb)
{
	requestHandlers[messageName] = cb;
};
