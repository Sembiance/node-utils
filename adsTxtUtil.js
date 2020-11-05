"use strict";

const XU = require("@sembiance/xu"),
	util = require("util"),
	tiptoe = require("tiptoe"),
	fs = require("fs");

// Parses a given ads.txt file
exports.parseFile = function parseFile(adsTxtPath, cb)
{
	tiptoe(
		function loadFile()
		{
			fs.readFile(adsTxtPath, XU.UTF8, this);
		},
		function returnResults(adsTxtRaw)
		{
			this(undefined, exports.parse(adsTxtRaw));
		},
		cb
	);
};

// Parses the passed in adsTxt content and returns an object representing it
exports.parse = function parse(adsTxtRaw)
{
	let groupid = null;
	const adsTxt = { prefix : [], groupOrder : [], groups : {} };

	adsTxtRaw.split("\n").forEach(line =>
	{
		// Comment line
		if((line.startsWith("#") && !groupid) || line.trim().length===0)
		{
			// If we don't have any domains yet, then it's part of the prefix of the file
			if(!groupid)
				adsTxt.prefix.push(line);

			return;
		}

		if(line.startsWith("#") || !groupid)
		{
			groupid = (!groupid ? adsTxt.prefix.pop() : line);

			// Start of a new group
			if(adsTxt.groups.hasOwnProperty(groupid))
				return console.error("Group already seen! %s", line);
				
			adsTxt.groups[groupid] = [];
			adsTxt.groupOrder.push(groupid);
			
			if(line.startsWith("#"))
				return;
		}
		
		const cols = line.split(",");
		if(cols.length<3)
			return console.error("Line missing columns: %s", line);
		
		if(cols.length>4)
			return console.error("Line has too many columns: %s", line);

		const [domain, accountid, type, authid] = cols.map(col => col.trim());

		adsTxt.groups[groupid].push({domain, accountid, type, authid});
	});

	return adsTxt;
};

// Reformualtes the output of .parse() above into an array of lines
exports.reformulate = function reformulate(adsTxt)
{
	const lines = [];

	lines.push(...adsTxt.prefix);
	adsTxt.groupOrder.forEach((groupid, i) =>
	{
		if(i>0)
			lines.push("");

		lines.push(groupid);
		adsTxt.groups[groupid].forEach(groupEntry =>
		{
			let line = util.format("%s, %s, %s", groupEntry.domain, groupEntry.accountid, groupEntry.type);
			if(groupEntry.authid)
				line += `, ${groupEntry.authid}`;
			
			lines.push(line);
		});
	});

	return lines;
};

