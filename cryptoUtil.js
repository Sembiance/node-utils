"use strict";
const crypto = require("crypto");

exports.blowfishEncrypt = function blowfishEncrypt(key, iv, data)
{
	const encrypt = crypto.createCipheriv("BF", key, iv);
	return encrypt.update(data, "utf8", "hex") + encrypt["final"]("hex");
};

exports.blowfishDecrypt = function blowfishDecrypt(key, iv, data)
{
	const decrypt = crypto.createDecipheriv("BF", key, iv);
	return decrypt.update(data, "hex", "utf8") + decrypt["final"]("utf8");
};
