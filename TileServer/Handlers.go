package main

import (
	"encoding/binary"
	"log"
	"net/http"
	"os"
	"strconv"

	bolt "github.com/coreos/bbolt"
	"github.com/gorilla/mux"
)

var (
	db                                    *bolt.DB
	devopdb                               *bolt.DB
	edgedb                                *bolt.DB
	masterdbpath, devopdbpath, edgedbpath string
)

// GetDB is db getter.
func GetDB(nameof string) *bolt.DB {
	switch nameof {
	case "master", "":
		return db
	case "devop":
		return devopdb
	case "edge":
		return edgedb
	default:
		log.Println("invalid db requested")
	}
	return nil
}

func fileExists(pathto string) bool {
	_, err := os.Stat(pathto)
	if err == nil {
		return true
	}
	if os.IsNotExist(err) {
		return false
	}
	panic(err.Error())
}

// string arg for da cattrack main to rid dis
func InitBoltDB(nameof, boltDb string) error {
	var err error
	bopts := &bolt.Options{}
	switch nameof {
	case "master", "":
		if db != nil {
			db.Close()
		}
		if boltDb == "" {
			boltDb = masterdbpath
		}
		if fileExists(boltDb) {
			bopts.ReadOnly = true
		}
		db, err = bolt.Open(boltDb, 0666, bopts)
		masterdbpath = boltDb
	case "devop":
		if devopdb != nil {
			devopdb.Close()
		}
		if boltDb == "" {
			boltDb = devopdbpath
		}
		if fileExists(boltDb) {
			bopts.ReadOnly = true
		}
		devopdb, err = bolt.Open(boltDb, 0666, bopts)
		devopdbpath = boltDb
	case "edge":
		if edgedb != nil {
			edgedb.Close()
		}
		if boltDb == "" {
			boltDb = edgedbpath
		}
		if fileExists(boltDb) {
			bopts.ReadOnly = true
		}
		edgedb, err = bolt.Open(boltDb, 0666, bopts)
		edgedbpath = boltDb
	}
	if err != nil {
		log.Println("Could not initialize Bolt database. ", err)
	} else {
		log.Println("Bolt db is initialized at ", boltDb)
	}
	return err
}

func i32tob(v int32) []byte {
	b := make([]byte, 8)
	binary.BigEndian.PutUint32(b, uint32(v))
	return b
}

func RefreshDB(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	vars := mux.Vars(r)
	dbName := vars["db"]
	if dbName == "" {
		http.Error(w, "invalid db name", http.StatusBadRequest)
		return
	}
	if err := InitBoltDB(dbName, ""); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Write([]byte("OK:" + dbName))
}

func TilesBolty(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/x-protobuf")
	w.Header().Set("Content-Encoding", "gzip") // set response header for encoding (browsers may do the ungzipping)
	// https://github.com/SpatialServer/Leaflet.MapboxVectorTile/issues/29

	vars := mux.Vars(r)
	dbname := vars["db"]
	z := vars["z"]
	x := vars["x"]
	y := vars["y"]

	//dafuc
	zoomLevel, e1 := strconv.ParseUint(z, 10, 32)
	if e1 != nil {
		log.Println(e1.Error())
	}

	// dafaq
	colNum, e13 := strconv.ParseUint(x, 10, 32)
	if e13 != nil {
		log.Println(e13.Error())
	}

	rowNum, e2 := strconv.ParseUint(y, 10, 32)
	if e2 != nil {
		log.Println(e1.Error())
	}
	var qrow = (1 << zoomLevel) - 1 - rowNum

	// tile data bytes for response
	var tileData []byte
	db := GetDB(dbname)
	if db == nil {
		http.Error(w, "invalid db parameter", http.StatusBadRequest)
	}
	e := db.View(func(tx *bolt.Tx) error {
		bz := tx.Bucket(i32tob(int32(zoomLevel)))
		if bz == nil { // these are the cases the map is requesting a tile that we haven't made :paw_prints: in yet
			log.Println("E: bucket by zoom empty")
			w.Write(nil)
			return nil
		}
		bx := bz.Bucket(i32tob(int32(colNum)))
		if bx == nil {
			log.Println("E: bucket by col empty")
			w.Write(nil)
			return nil
		}

		n := i32tob(int32(qrow))
		tileData = bx.Get(n)
		return nil
	})
	if e != nil {
		log.Println("getboltdb", e)
	}

	if tileData == nil {
		log.Println("td war nil", z, x, y)
		w.Write(nil)
	}
	w.Write(tileData)
}
