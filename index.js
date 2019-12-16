"use strict";
/* eslint global-require: 0 */

module.exports =
{
	// Doing it this way means the files don't get required unless they are actually used
	get run() { return require("./runUtil.js"); },
	get file() { return require("./fileUtil.js"); },
	get dust() { return require("./dustUtil.js"); },
	get unicode() { return require("./unicodeUtil.js"); },
	get crypto() { return require("./cryptoUtil.js"); },
	get print() { return require("./printUtil.js"); },
	get video() { return require("./videoUtil.js"); },
	get http() { return require("./httpUtil.js"); },
	get image() { return require("./imageUtil.js"); },
	get diff() { return require("./diffUtil.js"); },
	get net() { return require("./netUtil.js"); },
	get sendgrid() { return require("./sendgridUtil.js"); },
	get redis() { return require("./redisUtil.js"); },
	get zip() { return require("./zipUtil.js"); },
	get adsTxt() { return require("./adsTxtUtil.js"); }
};
