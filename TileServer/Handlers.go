package main

import (
	"encoding/binary"
	"log"
	"net/http"
	"os"
	"strconv"

	bolt "github.com/coreos/bbolt"
	"github.com/gorilla/mux"
	"sync"
)

var (
	db                                    *bolt.DB
	devopdb                               *bolt.DB
	edgedb                                *bolt.DB
	masterdbpath, devopdbpath, edgedbpath string
	mumaster, mudev, muedge               sync.Mutex
)

// GetDB is db getter.
func GetDB(nameof string) (db *bolt.DB) {
	// defer func() {
	// 	if !db.Open()
	// }()
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

func aorb(ab string) string {
	if ab == "a" {
		return "b"
	}
	return "a"
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
		// if !fileExists(boltDb) {
		// 	boltDb = masterdbpath + aorb(ab)
		// }
		// if !fileExists(boltDb) {
		// 	panic(nameof + ":nodb")
		// }
		log.Println("opening", nameof, boltDb)
		db, err = bolt.Open(boltDb, 0660, bopts)
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
		// if !fileExists(boltDb) {
		// 	boltDb = devopdbpath + aorb(ab)
		// }
		// if !fileExists(boltDb) {
		// 	panic(nameof + ":nodb")
		// }
		log.Println("opening", nameof, boltDb)
		devopdb, err = bolt.Open(boltDb, 0660, bopts)
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
		// if !fileExists(boltDb) {
		// 	boltDb = edgedbpath + aorb(ab)
		// }
		// if !fileExists(boltDb) {
		// 	panic(nameof + ":nodb")
		// }
		log.Println("opening", nameof, boltDb)
		edgedb, err = bolt.Open(boltDb, 0660, bopts)
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

func lockdb(nameof string) {
	switch nameof {
	case "master":
		mumaster.Lock()
	case "devop":
		mudev.Lock()
	case "edge":
		mudev.Lock()
	}
}
func unlockdb(nameof string) {
	switch nameof {
	case "master":
		mumaster.Unlock()
	case "devop":
		mudev.Unlock()
	case "edge":
		mudev.Unlock()
	}
}

func RefreshDB(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	vars := mux.Vars(r)
	dbName := vars["db"]
	log.Println("handling refreshdb db=", dbName)
	if dbName == "" {
		http.Error(w, "invalid db name", http.StatusBadRequest)
		return
	}
	// lockdb(dbName)
	// defer unlockdb(dbName)
	// if err := InitBoltDB(dbName, ""); err != nil {
	// 	http.Error(w, err.Error(), http.StatusInternalServerError)
	// 	return
	// }
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
	// lockdb(dbname)
	// defer unlockdb(dbname)
	// db, err := bolt.Open(dbp, 0660, &bolt.Options{ReadOnly: true})
	// db := GetDB(dbname)

	// for _, p := range []string{masterdbpath, devopdbpath, edgedbpath} {
	// 	if p == "" {
	// 		InitBoltDB(dbname, "")
	// 		break
	// 	}
	// }

	var dbp string
	switch dbname {
	case "master":
		dbp = masterdbpath
	case "devop":
		dbp = devopdbpath
	case "edge":
		dbp = edgedbpath
	default:
		http.Error(w, "invalid db parameter", http.StatusBadRequest)
		return
	}

	log.Println("TILEGET: db/z/x/y path", dbname, z, x, y, dbp)

	InitBoltDB(dbname, "")
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
