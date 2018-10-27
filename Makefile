.DEFAULT_GOAL := getem

TRACKS_UPSTREAM_ROOT=/home/freyabison/track.areteh.co
PUNKTS_UPSTREAM_ROOT=/home/freyabison/punktlich.rotblauer.com

COMMIT=`git rev-parse HEAD`


export GOPATH?=${HOME}/go

getem: clean download update rundump upload

clean:
	mkdir -p ./bak
	-mv ./out* ./tracks* ./tippedcanoe* ./bak/

download:
	./getems/clone_adjacent_upstream.sh
	rsync -avzLhP --delete freya:${TRACKS_UPSTREAM_ROOT}/tracks.db.sync ./tracks.db

update:
	git --work-tree=${GOPATH}/src/github.com/rotblauer/trackpoints --git-dir=${GOPATH}/src/github.com/rotblauer/trackpoints/.git branch --set-upstream-to=origin/master master
	git branch --set-upstream-to=origin/master master
	go get -v -u github.com/rotblauer/tileTester2/...
	@echo "GIT HEAD=$(BINARY)"

rundump:
	go build -o dumper dump.go
	./dumper

upload:
	gzip --best --keep --verbose ./tippedcanoetrack.db
	rsync -avzLPh ./tippedcanoetrack.db.gz freya:${PUNKTS_UPSTREAM_ROOT}/tippedcanoetrack.db.gz
	./getems/decompress_and_update_upstream.sh
	cp tippedcanoetrack.db ./TileServer/tester.db

nuke:
	rm -rf ./TileServer/tester.db
	rm -rf ./bak
	rm -rf ./out* ./tracks* ./tippedcanoe*

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: getem clean download update rundump upload nuke help
