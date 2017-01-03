"use strict";

var base = require("@sembiance/xbase"),
	helper = require('sendgrid').mail;

exports.send = function(apiKey, msg, cb)
{
	var mail = new helper.Mail(new helper.Email(msg.from), msg.subject, new helper.Email(msg.to), new helper.Content("text/plain", msg.text));

	var sg = require("sendgrid")(apiKey);
	var request = sg.emptyRequest({
		method : "POST",
		path   : "/v3/mail/send",
		body   : mail.toJSON(),
	});

	sg.API(request, cb);
};
