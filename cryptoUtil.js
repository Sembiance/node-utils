"use strict";

var crypto = require("crypto");

exports.blowfishEncrypt = function blowfishEncrypt(key, iv, data)
{
	var encrypt = crypto.createCipheriv("BF", key, iv);

	var hex = encrypt.update(data, "utf8", "hex");
	hex += encrypt.final("hex");

	return hex;
};

exports.blowfishDecrypt = function blowfishDecrypt(key, iv, data)
{
	var decrypt = crypto.createDecipheriv("BF", key, iv);

	var result = decrypt.update(data, "hex", "utf8");
	result += decrypt.final("utf8");

	return result;
};
