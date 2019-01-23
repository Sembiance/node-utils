"use strict";

const uuid = require("uuid/v4");

const requestCallbacks = {};
const requestHandlers = {};

function messageHandler(bridge, messageName, messageData, requestid, socketid)
{
	if(requestCallbacks.hasOwnProperty(requestid))
	{
		requestCallbacks[requestid](undefined, messageName, messageData);
		delete requestCallbacks[requestid];
	}
	else if(requestHandlers.hasOwnProperty(messageName))
	{
		requestHandlers[messageName](undefined, messageData, (responseName, responseData) => bridge.send("request", [responseName, responseData, requestid], socketid));
	}
}

exports.registerBridge = function registerBridge(bridge)
{
	bridge.on("message_request", (message, socketid) => messageHandler(bridge, message[0], message[1], message[2], socketid));
};

exports.sendRequest = function sendRequest(bridge, messageName, messageData, cb, socketid)
{
	const requestid = uuid();
	requestCallbacks[requestid] = cb;
	
	bridge.send("request", [messageName, messageData, requestid], (socketid || undefined));
};

exports.handleRequest = function handleRequest(messageName, cb)
{
	requestHandlers[messageName] = cb;
};
