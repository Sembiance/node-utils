"use strict";

const base = require("@sembiance/xbase"),
	mailHelper = require("sendgrid").mail;

exports.send = function send(apiKey, msg, cb)
{
	const mail = new mailHelper.Mail(new mailHelper.Email(msg.from), msg.subject, new mailHelper.Email(msg.to), new mailHelper.Content("text/plain", msg.text));

	const sg = require("sendgrid")(apiKey);	// eslint-disable-line global-require
	const request = sg.emptyRequest({
		method : "POST",
		path   : "/v3/mail/send",
		body   : mail.toJSON()
	});

	sg.API(request, cb);	// eslint-disable-line new-cap
};
