"use strict";

const XU = require("@sembiance/xu"),
	sendgridUtil = require("../index").sendgrid;

if(process.argv.length<3)
{
	console.log("Usage: node sendgrid.js <sendGrid API Key>");
	process.exit(1);
}

const code = Math.randomInt(0, 99999);

sendgridUtil.send(process.argv[2], {
	to      : "robert@cosmicrealms.com",
	from    : "robert@telparia.com",
	subject : `"Test e-mail message ${code}`,
	text    : `This is just a test to see if the e-mail sending works. Code: ${code}`
}, () => { console.log("Check robert@cosmicrealms.com e-mail for code %d", code); process.exit(0); });
