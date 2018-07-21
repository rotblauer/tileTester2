#!/usr/bin/env bash




rsync -avz --progress freya:~/track.areteh.co/tracks.db.sync ./tracks.db 

#sync from upstream static copy

go run dump.go -batchSize 100000

go tool pprof cpu.prof 