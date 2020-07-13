#!/bin/bash

HDIMGPATH=`realpath hd.img`

if ! losetup -nl | grep -q "$HDIMGPATH"; then
	echo "mounting"
	losetup -Pf --show "$HDIMGPATH"
fi

LOOPDEV=$(losetup -nl | grep "$HDIMGPATH" | cut -d ' ' -f 1)

sudo mount -t vfat -o uid=7777 "$LOOPDEV""p1" ./hd
