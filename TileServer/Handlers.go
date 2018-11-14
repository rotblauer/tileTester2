package main

import (
	"encoding/binary"
	"log"
	"net/http"
	"strconv"

	bolt "github.com/etcd-io/bbolt"
	"github.com/gorilla/mux"
)

var (
	db                                                  *bolt.DB
	devopdb                                             *bolt.DB
	edgedb                                              *bolt.DB
	placesdb                                            *bolt.DB
	masterdbpath, devopdbpath, edgedbpath, placesdbpath string
)

// GetDB is db getter.
func GetDB(nameof string) (db *bolt.DB) {
	switch nameof {
	case "master", "":
		return db
	case "devop":
		return devopdb
	case "edge":
		return edgedb
	case "places":
		return placesdb
	default:
		log.Println("invalid db requested")
	}
	return nil
}

// string arg for da cattrack main to rid dis
func InitBoltDB(nameof, boltDb string) error {
	log.Println("initing boltdb name=", nameof)
	var err error
	bopts := &bolt.Options{}
	defer func() {
		log.Println("boltdb-refresh/init: path=", boltDb, "name=", nameof)
	}()
	switch nameof {
	case "master", "":
		if db != nil {
			log.Println("closing db=", nameof, boltDb)
			db.Close()
			log.Println("closed db=", nameof, boltDb)
			bopts.ReadOnly = true
		}
		if boltDb == "" {
			boltDb = masterdbpath
		}
		log.Println("opening", nameof, boltDb)
		// db, err = bolt.Open(boltDb, 0660, bopts)
		masterdbpath = boltDb
	case "devop":
		if devopdb != nil {
			log.Println("closing db=", nameof, boltDb)
			devopdb.Close()
			log.Println("closed db=", nameof, boltDb)
			bopts.ReadOnly = true
		}
		if boltDb == "" {
			boltDb = devopdbpath
		}
		log.Println("opening", nameof, boltDb)
		// devopdb, err = bolt.Open(boltDb, 0660, bopts)
		devopdbpath = boltDb
	case "edge":
		if edgedb != nil {
			log.Println("closing db=", nameof, boltDb)
			edgedb.Close()
			log.Println("closed db=", nameof, boltDb)
			bopts.ReadOnly = true
		}
		if boltDb == "" {
			boltDb = edgedbpath
		}
		log.Println("opening", nameof, boltDb)
		// edgedb, err = bolt.Open(boltDb, 0660, bopts)
		edgedbpath = boltDb

	case "places":
		if placesdb != nil {
			log.Println("closing db=", nameof, boltDb)
			placesdb.Close()
			log.Println("closed db=", nameof, boltDb)
			bopts.ReadOnly = true
		}
		if boltDb == "" {
			boltDb = placesdbpath
		}
		log.Println("opening", nameof, boltDb)
		// epathdgedb, err = bolt.Open(boltDb, 0660, bopts)
		placesdbpath = boltDb
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

// RefreshDB is probably completely useless b/c TilesBolty does same thing
func RefreshDB(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	vars := mux.Vars(r)
	dbName := vars["db"]
	log.Println("handling refreshdb db=", dbName)
	if dbName == "" {
		http.Error(w, "invalid db name", http.StatusBadRequest)
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

	var dbp string
	switch dbname {
	case "master":
		dbp = masterdbpath
	case "devop":
		dbp = devopdbpath
	case "edge":
		dbp = edgedbpath
	case "places":
		dbp = placesdbpath
	default:
		http.Error(w, "invalid db parameter", http.StatusBadRequest)
		return
	}

	log.Println("TILEGET: db/z/x/y path", dbname, z, x, y, dbp)

	InitBoltDB(dbname, "") // dunno why
	db, err := bolt.Open(dbp, 0660, &bolt.Options{ReadOnly: true})
	// db, err := bolt.Open(dbp, 0660, nil)
	log.Println("opendb")
	defer db.Close()
	if db == nil {
		http.Error(w, "invalid db parameter", http.StatusBadRequest)
		return
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
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
