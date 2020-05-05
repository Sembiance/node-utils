#!/bin/bash
if ! losetup -nl | grep -q /mnt/compendium/DevLab/node-modules/xutil/dos/hd.img; then
	echo "mounting"
	losetup -Pf --show /mnt/compendium/DevLab/node-modules/xutil/dos/hd.img
fi

LOOPDEV=$(losetup -nl | grep /mnt/compendium/DevLab/node-modules/xutil/dos/hd.img | cut -d ' ' -f 1)

sudo mount -t vfat -o uid=7777 "$LOOPDEV""p1" /mnt/compendium/DevLab/node-modules/xutil/dos/hd
