#!/usr/bin/env bash

ssh freya <<\EOI
cd punktlich.rotblauer.com
gzip --decompress ./tippedcanoetrack.db.gz
mv ./tippedcanoetrack.db ./tester.db
./kickstart
exit
EOI
