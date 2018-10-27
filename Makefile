.DEFAULT_GOAL := getem

TRACKS_UPSTREAM_ROOT=/home/freyabison/track.areteh.co
PUNKTS_UPSTREAM_ROOT=/home/freyabison/punktlich.rotblauer.com

COMMIT=`git rev-parse HEAD`


export GOPATH?=${HOME}/go

getem: clean download update rundump upload ## Run getem [clean,download,update,rudump,upload]

clean: ## Remove ./bak/ and all artifacts from geteming.
	mkdir -p ./bak
	-mv ./out* ./tracks* ./tippedcanoe* ./bak/

download: ## Locks and clones upstream db (clone on upstream), then syncs the clone to local.
	./getems/clone_adjacent_upstream.sh
	rsync -avzLhP --delete freya:${TRACKS_UPSTREAM_ROOT}/tracks.db.sync ./tracks.db

update: ## Updates project root (eg. dumper)
	git --work-tree=${GOPATH}/src/github.com/rotblauer/trackpoints --git-dir=${GOPATH}/src/github.com/rotblauer/trackpoints/.git branch --set-upstream-to=origin/master master
	git branch --set-upstream-to=origin/master master
	go get -v -u github.com/rotblauer/tileTester2/...
	@echo "GIT HEAD=$(COMMIT)"

rundump: ## Runs database dump -> out.json.gz, which is then pumped to tippecanoe for mbtiles, and that then to tippedcanoetrack.db.
	go build -o dumper dump.go
	./dumper

upload: ## gzips and uploads tippedcanoetrack.db to upstream. Then restarts tileserver.
	gzip --best --keep --verbose ./tippedcanoetrack.db
	rsync -avzLPh ./tippedcanoetrack.db.gz freya:${PUNKTS_UPSTREAM_ROOT}/tippedcanoetrack.db.gz
	./getems/decompress_and_update_upstream.sh

nuke: ## Removes all possible getem artifacts
	rm -rf ./TileServer/tester.db
	rm -rf ./bak
	rm -rf ./out* ./tracks* ./tippedcanoe*

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: getem clean download update rundump upload nuke help
