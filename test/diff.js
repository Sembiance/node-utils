"use strict";

const diffUtil = require("../index").diff;

console.log(diffUtil.diff("a", "b"));
console.log(diffUtil.diff(1, 2));
console.log(diffUtil.diff(true, false));

console.log(diffUtil.diff(["a", 1, true], ["b", 1, 2]));

console.log(diffUtil.diff({num : 1, sexy : true, color : "red", pets : ["cat", "dog"], employed : false}, {num : 6, color : "green", pets : ["cat", "bird"], employed : true, age : 47}));

console.log(diffUtil.diff({abc : "+1: Creatures you control get +1/+1 and gain haste until end of turn.\n\n-2: Gain control of target creature until end of turn. Untap that creature. It gains haste until end of turn.\n\n-6: Put five 4/4 red Dragon creature tokens with flying onto the battlefield."}, {abc : "+1: Creatures you control get +1/+1 and gain haste until end of turn.\n\n−2: Gain control of target creature until end of turn. Untap that creature. It gains haste until end of turn.\n\n−6: Put five 4/4 red Dragon creature tokens with flying onto the battlefield."}));	// eslint-disable-line max-len
