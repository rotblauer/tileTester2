.DEFAULT_GOAL := getem

TRACKS_UPSTREAM_ROOT=/home/freyabison/track.areteh.co
PUNKTS_UPSTREAM_ROOT=/home/freyabison/punktlich.rotblauer.com

export TRACKS_DATA?=${HOME}/tdata
export GOPATH?=${HOME}/go

# getem: clean download update rundump setup server ## Run getem

migrate: get install ## Runs and explains stuff for setting up a new serving and tipping host.
	mkdir -p ${TRACKS_DATA}/bak
	./getems/clone_once.sh # Doesn't turn freya back on.
	rsync -avzLhP --delete freya:${TRACKS_UPSTREAM_ROOT}/tracks.db.sync ${TRACKS_DATA}/tracks.db
	dumpy --in=${TRACKS_DATA}/tracks.db --out=${TRACKS_DATA}/master.snap --boltout=${TRACKS_DATA}/tiles-master.snap.db --tileset-name=catTrack # Run the last dump from bolt(tracks.db) -> "out.json.gz"
	mv ${TRACKS_DATA}/tiles-master.snap.db ${TRACKS_DATA}/tiles-master.db
	@echo "Now:"
	@echo "1. Run cattracks on this host in own process. Probably this should be run as a systemd service."
	@echo " > catTracks --port 3001 --db-path-master=${TRACKS_DATA}/tracks.db --tracks-gz-path=${TRACKS_DATA}/master.json.gz --devop-gz-path=${TRACKS_DATA}/devop.json.gz --edge-gz-path=${TRACKS_DATA}/edge.json.gz"
	@echo "2. SSH to freya and turn catTracks back on, with --forward-url='this host'. This will ensure that dbs and json.gzs are in sync and none are skipped by the migration"
	@echo "3. In a new thread, turn the tileserver on by running '$ make runts'. Probably this should be run as a systemd service."
	@echo "4. Each in their own threads, run getem/{master,devop,edge}"
	@echo "5. Profit"

install: ## Install packages: dumpy, tileserver, and catTracks.
	go build -o ${GOPATH}/bin/dumpy github.com/rotblauer/tileTester2/dump.go
	go build -o ${GOPATH}/bin/tileserver github.com/rotblauer/tileTester2/TileServer
	go install github.com/rotblauer/catTracks

runct: ## Run catTracks. Probably this command should be managed thru a systemd service, and only used via make for development.
	-pkill catTracks
	catTracks --port 3001 --db-path-master=${TRACKS_DATA}/tracks.db --tracks-gz-path=${TRACKS_DATA}/master.json.gz --devop-gz-path=${TRACKS_DATA}/devop.json.gz --edge-gz-path=${TRACKS_DATA}/edge.json.gz

runts: ## Run tileserver. Probably this command should be managed thru a systemd service, and only used via make for development.
	-pkill tileserver
	tileserver --db=${TRACKS_DATA}/tiles-master.db --devop-db=${TRACKS_DATA}/tiles-devop.db --edge-db=${TRACKS_DATA}/tiles-edge.db

getem/master:
	-mv ${TRACKS_DATA}/edge.json.gz ${TRACKS_DATA}/devop.json.gz
	touch ${TRACKS_DATA}/edge.json.gz
	-mv ${TRACKS_DATA}/tiles-edge.db ${TRACKS_DATA}/tiles-devop.db
	curl http://catonmap.info:8080/devop/refresh

	rsync -avzLhP ${TRACKS_DATA}/master.json.gz ${TRACKS_DATA}/master.snap.json.gz
	dumpy --tipponly --out=${TRACKS_DATA}/master.snap --boltout=${TRACKS_DATA}/tiles-master.snap.db --tileset-name=catTrack

	mv ${TRACKS_DATA}/tiles-master.snap.db ${TRACKS_DATA}/tiles-master.db
	curl http://catonmap.info:8080/master/refresh

	$(MAKE) --no-print-directory clean

getem/devop:
	rsync -avzLhP ${TRACKS_DATA}/devop.json.gz ${TRACKS_DATA}/devop.snap.json.gz
	dumpy --tipponly --out=${TRACKS_DATA}/devop.snap --boltout=${TRACKS_DATA}/tiles-devop.snap.db --tileset-name=catTrackDevop

	mv ${TRACKS_DATA}/tiles-devop.snap.db ${TRACKS_DATA}/tiles-devop.db
	curl http://catonmap.info:8080/devop/refresh

	$(MAKE) --no-print-directory clean

getem/edge:
	rsync -avzLhP ${TRACKS_DATA}/edge.json.gz ${TRACKS_DATA}/edge.snap.json.gz
	dumpy --tipponly --out=${TRACKS_DATA}/edge.snap --boltout=${TRACKS_DATA}/tiles-edge.snap.db --tileset-name=catTrackEdge

	mv ${TRACKS_DATA}/tiles-edge.snap.db ${TRACKS_DATA}/tiles-edge.db
	curl http://catonmap.info:8080/edge/refresh

	$(MAKE) --no-print-directory clean

clean: ## Clean mbtiles
	-mv ${TRACKS_DATA}/*.mbtiles ${TRACKS_DATA}/bak/

download: ## Locks and clones upstream db (clone on upstream), then syncs the clone to local.
	./getems/clone_adjacent_upstream.sh
	rsync -avzLhP --delete freya:${TRACKS_UPSTREAM_ROOT}/tracks.db.sync ./tracks.db

get: ## Updates project root (eg. dumper)
	git --work-tree=${GOPATH}/src/github.com/rotblauer/trackpoints --git-dir=${GOPATH}/src/github.com/rotblauer/trackpoints/.git branch --set-upstream-to=origin/master master
	git branch --set-upstream-to=origin/master master
	go get -v -u github.com/rotblauer/tileTester2/...
	go get -v -u github.com/rotblauer/catTracks/...
	git --work-tree=${GOPATH}/src/github.com/rotblauer/trackpoints rev-parse HEAD
	git --work-tree=${GOPATH}/src/github.com/rotblauer/tileTester2 rev-parse HEAD
	git --work-tree=${GOPATH}/src/github.com/rotblauer/catTracks rev-parse HEAD

rundump: ## Runs database dump -> out.json.gz, which is then pumped to tippecanoe for mbtiles, and that then to tippedcanoetrack.db.
	go build -o dumper dump.go
	./dumper

setup: ## Moves local db to tileserver for redundant maps server
	mv ./tippedcanoetrack.db ./TileServer/t2.db

upload: ## gzips and uploads tippedcanoetrack.db to upstream. Then restarts tileserver.
	gzip --best --keep --verbose ./tippedcanoetrack.db
	rsync -avzLPh ./tippedcanoetrack.db.gz freya:${PUNKTS_UPSTREAM_ROOT}/tippedcanoetrack.db.gz
	./getems/decompress_and_update_upstream.sh

server:
	-pkill TileServer
	go build -o TileServer/TileServer ./TileServer
	./TileServer/TileServer -db ./TileServer/t2.db

nuke: ## Removes all possible getem artifacts
	rm -rf ./TileServer/tester.db
	rm -rf ./bak
	rm -rf ./out* ./tracks* ./tippedcanoe*

# # but if we're receiving forwarded POSTs from freya, then eventually no need to download
# r2d2: download update rundump
# 	mv tippedcanoetrack.db ./TileServer/t2.db

# rd2dmigrate: ## should copy db from upstream freya once, then be ready to accept incoming POSTs from freya for updating /populate/db points

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: getem clean download update rundump upload nuke server help
