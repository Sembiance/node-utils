"use strict";
const XU = require("@sembiance/xu"),
	sgMail = require("@sendgrid/mail");

exports.send = function send(apiKey, msg, cb)
{
	sgMail.setApiKey(apiKey);
	sgMail.send(msg, cb);
};
