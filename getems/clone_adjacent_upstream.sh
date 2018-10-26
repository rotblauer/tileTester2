#!/usr/bin/env bash

ssh freya <<\EOI
kill $(ps aux | grep "[t]rackermain" | awk '{print $2}')
cd track.areteh.co
echo "LOCK" > ./LOCK
rsync -avzLPhu ./db/tracks.db ./tracks.db.sync
rm -f ./LOCK
./kickstart
exit
EOI
