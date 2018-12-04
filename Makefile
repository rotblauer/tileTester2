.DEFAULT_GOAL := getem

TRACKS_UPSTREAM_ROOT=/home/freyabison/track.areteh.co
PUNKTS_UPSTREAM_ROOT=/home/freyabison/punktlich.rotblauer.com

export TRACKS_DATA?=${HOME}/tdata
export GOPATH?=${HOME}/go
export CATTS_ENDPOINT?=http://catonmap.info:8080

# getem: clean download update rundump setup server ## Run getem

updump: ## updump dumps the points collected in tracks.db to master.json.gz
	-systemctl stop catTracks.service
	cp ${TRACKS_DATA}/master.json.gz ${TRACKS_DATA}/master.json.gz.bak
	dumpy --in=${TRACKS_DATA}/tracks.db --out=${TRACKS_DATA}/master.snap # Run the last dump from bolt(tracks.db) -> "out.json.gz"
	mv ${TRACKS_DATA}/master.snap.json.gz ${TRACKS_DATA}/master.json.gz
# rsync -avzLhP /root/tdata/master.json.gz freya:/home/freyabison/tracks.areteh.co/master.json.gz
	-systemctl start catTracks.service

migrate: get install ## Runs and explains stuff for setting up a new serving and tipping host.
	mkdir -p ${TRACKS_DATA}/bak
	./getems/clone_once.sh # Doesn't turn freya back on.
	rsync -avzLhP --delete freya:${TRACKS_UPSTREAM_ROOT}/tracks.db.sync ${TRACKS_DATA}/tracks.db
	dumpy --in=${TRACKS_DATA}/tracks.db --out=${TRACKS_DATA}/master.snap --boltout=${TRACKS_DATA}/tiles-master.snap.db --tileset-name=catTrack # Run the last dump from bolt(tracks.db) -> "out.json.gz"
	mv ${TRACKS_DATA}/tiles-master.snap.db ${TRACKS_DATA}/tiles-master.db
# !!--> mv /root/tdata/master.snap.json.gz /root/data/master.json.gz
# !!--> rsync -avzLhP /root/tdata/master.json.gz freya:/home/freyabison/tracks.areteh.co/master.json.gz
	@echo "Now:"
	@echo "1. Run cattracks on this host in own process. Probably this should be run as a systemd service."
	@echo " > catTracks --port 3001 --db-path-master=${TRACKS_DATA}/tracks.db --tracks-gz-path=${TRACKS_DATA}/master.json.gz --devop-gz-path=${TRACKS_DATA}/devop.json.gz --edge-gz-path=${TRACKS_DATA}/edge.json.gz"
	@echo "2. SSH to freya and turn catTracks back on, with --forward-url='this host'. This will ensure that dbs and json.gzs are in sync and none are skipped by the migration"
	@echo "3. In a new thread, turn the tileserver on by running '$ make runts'. Probably this should be run as a systemd service."
	@echo "5. Profit"

get: ## Updates project root (eg. dumper)
	git --work-tree=${GOPATH}/src/github.com/rotblauer/trackpoints --git-dir=${GOPATH}/src/github.com/rotblauer/trackpoints/.git branch --set-upstream-to=origin/master master
	git branch --set-upstream-to=origin/master master
	go get -v -u github.com/rotblauer/tileTester2/...
	go get -v -u github.com/rotblauer/catTracks/...
	git --git-dir=${GOPATH}/src/github.com/rotblauer/trackpoints/.git rev-parse HEAD
	git --git-dir=${GOPATH}/src/github.com/rotblauer/tileTester2/.git rev-parse HEAD
	git --git-dir=${GOPATH}/src/github.com/rotblauer/catTracks/.git rev-parse HEAD

install: ## Install packages: dumpy, tileserver, and catTracks.
	go build -o ${GOPATH}/bin/dumpy ${GOPATH}/src/github.com/rotblauer/tileTester2/dump.go
	cd ${GOPATH}/src/github.com/rotblauer/tileTester2
	go build -o ${GOPATH}/bin/tileserver ./TileServer
	go install github.com/rotblauer/catTracks

runct: ## Run catTracks. Probably this command should be managed thru a systemd service, and only used via make for development.
	mkdir -p ${TRACKS_DATA}/bak
	-pkill catTracks
	catTracks --port 3001 --db-path-master=${TRACKS_DATA}/tracks.db --db-path-devop=${TRACKS_DATA}/devop.db --db-path-edge=${TRACKS_DATA}/edge.db --tracks-gz-path=${TRACKS_DATA}/master.json.gz --devop-gz-path=${TRACKS_DATA}/devop.json.gz --edge-gz-path=${TRACKS_DATA}/edge.json.gz --master-lock=${TRACKS_DATA}/MASTERLOCK --devop-lock=${TRACKS_DATA}/DEVOPLOCK --edge-lock=${TRACKS_DATA}/EDGELOCK --tiles-db-path-master=${TRACKS_DATA}/tiles-master.db --tiles-db-path-devop=${TRACKS_DATA}/tiles-devop.db --tiles-db-path-edge=${TRACKS_DATA}/tiles-edge.db --proc-master --proc-edge

runts: ## Run tileserver. Probably this command should be managed thru a systemd service, and only used via make for development.
	mkdir -p ${TRACKS_DATA}/bak
	-pkill tileserver
	tileserver --port 8081 --db=${TRACKS_DATA}/tiles-master.db --db-devop=${TRACKS_DATA}/tiles-devop.db --db-edge=${TRACKS_DATA}/tiles-edge.db

getem/master:
ifneq ("$(wildcard ${TRACKS_DATA}/EDGELOCK)", "")
	exit 1
endif
	touch ${TRACKS_DATA}/EDGELOCK
ifneq ("$(wildcard ${TRACKS_DATA}/DEVOPLOCK)", "")
	rm ${TRACKS_DATA}/EDGELOCK
	exit 1
endif
	touch ${TRACKS_DATA}/DEVOPLOCK
ifneq ("$(wildcard ${TRACKS_DATA}/MASTERLOCK)","")
	rm ${TRACKS_DATA}/EDGELOCK	${TRACKS_DATA}/DEVOPLOCK
	exit 1
endif
	touch ${TRACKS_DATA}/MASTERLOCK

	-mv ${TRACKS_DATA}/edge.json.gz ${TRACKS_DATA}/devop.json.gz
	> ${TRACKS_DATA}/edge.json.gz
	rm ${TRACKS_DATA}/EDGELOCK ${TRACKS_DATA}/DEVOPLOCK
	-mv ${TRACKS_DATA}/tiles-edge.db ${TRACKS_DATA}/tiles-devop.db
	curl --connect-timeout 1 ${CATTS_ENDPOINT}/devop/refresh

ifeq ("$(wildcard ${TRACKS_DATA}/master.json.gz)","")
	touch ${TRACKS_DATA}/master.json.gz
endif
	-rm ${TRACKS_DATA}/master.snap.json.gz
	-rsync -avLhP --delete-after ${TRACKS_DATA}/master.json.gz ${TRACKS_DATA}/master.snap.json.gz
# -cp ${TRACKS_DATA}/master.json.gz ${TRACKS_DATA}/master.snap.json.gz
	rm ${TRACKS_DATA}/MASTERLOCK

	dumpy --tipponly --out=${TRACKS_DATA}/master.snap --boltout=${TRACKS_DATA}/tiles-master.snap.db --tileset-name=catTrack

	-mv ${TRACKS_DATA}/tiles-master.snap.db ${TRACKS_DATA}/tiles-master.db
	curl --connect-timeout 1 ${CATTS_ENDPOINT}/master/refresh

	$(MAKE) --no-print-directory clean

	sleep 5

getem/devop:
ifneq ("$(wildcard ${TRACKS_DATA}/DEVOPLOCK)", "")
	sleep 1
	exit 1
endif
	touch ${TRACKS_DATA}/DEVOPLOCK
	rsync -avLhP --delete-after ${TRACKS_DATA}/devop.json.gz ${TRACKS_DATA}/devop.snap.json.gz || rm ${TRACKS_DATA}/DEVOPLOCK

	dumpy --tipponly --out=${TRACKS_DATA}/devop.snap --boltout=${TRACKS_DATA}/tiles-devop.snap.db --tileset-name=catTrackDevop

	-mv ${TRACKS_DATA}/tiles-devop.snap.db ${TRACKS_DATA}/tiles-devop.db
	curl --connect-timeout 1 ${CATTS_ENDPOINT}/devop/refresh

	$(MAKE) --no-print-directory clean

	sleep 1

getem/edge:
# rsync -avLhP  --delete ${TRACKS_DATA}/edge.json.gz ${TRACKS_DATA}/edge.snap.json.gz || rm ${TRACKS_DATA}/EDGELOCK
ifneq ("$(wildcard ${TRACKS_DATA}/EDGELOCK)", "")
	sleep 1
	exit 1
endif
	touch ${TRACKS_DATA}/EDGELOCK
	-cp ${TRACKS_DATA}/edge.json.gz ${TRACKS_DATA}/edge.snap.json.gz
	rm ${TRACKS_DATA}/EDGELOCK
	dumpy --tipponly --out=${TRACKS_DATA}/edge.snap --boltout=${TRACKS_DATA}/tiles-edge.snap.db --tileset-name=catTrackEdge

	-mv ${TRACKS_DATA}/tiles-edge.snap.db ${TRACKS_DATA}/tiles-edge.db
	curl --connect-timeout 1 ${CATTS_ENDPOINT}/edge/refresh

	$(MAKE) --no-print-directory clean

	sleep 1

clean: ## Clean mbtiles
	-mv ${TRACKS_DATA}/*mbtiles* ${TRACKS_DATA}/bak/

download: ## Locks and clones upstream db (clone on upstream), then syncs the clone to local.
	./getems/clone_adjacent_upstream.sh
	rsync -avzLhP --delete freya:${TRACKS_UPSTREAM_ROOT}/tracks.db.sync ./tracks.db

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
