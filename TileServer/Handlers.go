package main

import (
	"database/sql"
	"net/http"

	"fmt"

	"github.com/gorilla/mux"
	_ "github.com/mattn/go-sqlite3"
	// "github.com/paulmach/go.vector_tile"
	//"strconv"
	"encoding/binary"
	"github.com/boltdb/bolt"
	"strconv"
)

func Tiles(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/x-protobuf")
	w.Header().Set("Content-Encoding", "gzip") // set response header for encoding (browsers may do the ungzipping)
	// https://github.com/SpatialServer/Leaflet.MapboxVectorTile/issues/29
	vars := mux.Vars(r)
	//dbname := vars["db"]
	z := vars["z"]
	x := vars["x"]
	y := vars["y"]
	db, err := sql.Open("sqlite3", "./tiles.mbtiles") //"./tiles.mbtiles")
	if err != nil {
		fmt.Print(err.Error())

	}

	//dafuc
	zoom_level, e1 := strconv.ParseUint(z, 10, 32)
	if e1 != nil {
		fmt.Println(e1.Error())
	}
	rowNum, e2 := strconv.ParseUint(y, 10, 32)
	if e2 != nil {
		fmt.Println(e1.Error())
	}
	var qrow = (1 << zoom_level) - 1 - rowNum
	qrows := fmt.Sprint(qrow)

	//dafuc 2
	rows, err := db.Query("SELECT * FROM tiles WHERE zoom_level = ?  AND tile_column = ? AND tile_row = ?", z, x, qrows)
	if err != nil {
		fmt.Print(err.Error())

	}
	for rows.Next() {

		var zoom_level int32
		var tile_column int32
		var tile_row int32
		var tile_data []byte
		rows.Scan(&zoom_level, &tile_column, &tile_row, &tile_data) //tile_data blob)
		w.Write(tile_data)
	}

	db.Close()
}

var (
	db             *bolt.DB
	undumpTrackKey = "mbtracks"
)

// GetDB is db getter.
func GetDB() *bolt.DB {
	return db
}

// string arg for da cattrack main to rid dis
func InitBoltDB(boltDb string) error {

	var err error
	db, err = bolt.Open(boltDb, 0666, nil)

	if err != nil {
		fmt.Println("Could not initialize Bolt database. ", err)
	} else {
		fmt.Println("Bolt db is initialized at ", boltDb)
		db.Update(func(tx *bolt.Tx) error {
			// "tracks" -- this is the default bucket, keyed on time.UnixNano
			_, e := tx.CreateBucketIfNotExists([]byte(undumpTrackKey))
			if e != nil {
				return e
			} else {
				fmt.Println("Ensured existance of bucket ", undumpTrackKey)
			}
			return e
		})
	}
	return err
}

func i32tob(v int32) []byte {
	b := make([]byte, 8)
	binary.BigEndian.PutUint32(b, uint32(v))
	return b
}

// http://stackoverflow.com/questions/17539001/converting-int32-to-byte-array-in-go
const BYTES_IN_INT32 = 8

func unsafeCaseInt32ToBytes(val int32) []byte {
	hdr := reflect.SliceHeader{Data: uintptr(unsafe.Pointer(&val)), Len: BYTES_IN_INT32, Cap: BYTES_IN_INT32}
	return *(*[]byte)(unsafe.Pointer(&hdr))
}

func TilesBolty(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/x-protobuf")
	w.Header().Set("Content-Encoding", "gzip") // set response header for encoding (browsers may do the ungzipping)
	// https://github.com/SpatialServer/Leaflet.MapboxVectorTile/issues/29
	vars := mux.Vars(r)
	//dbname := vars["db"]
	z := vars["z"]
	x := vars["x"]
	y := vars["y"]

	//dafuc
	zoomLevel, e1 := strconv.ParseUint(z, 10, 32)
	if e1 != nil {
		fmt.Println(e1.Error())
	}
	rowNum, e2 := strconv.ParseUint(y, 10, 32)
	if e2 != nil {
		fmt.Println(e1.Error())
	}

	// // dafaq
	// colNum, e13 := strconv.ParseUint(x, 10, 32)
	// if e13 != nil {
	// 	fmt.Println(e13.Error())
	// }

	var qrow = (1 << zoomLevel) - 1 - rowNum
	qrows := fmt.Sprint(qrow)

	colNum, e13 := strconv.ParseUint(qrows, 10, 32)
	if e13 != nil {
		fmt.Println(e13.Error())
	}

	fmt.Println("z:", z, "x:", x, "y:", y, "|", "cz:", zoomLevel, "cx:", colNum, "cy:", colNum)

	// TODO: unsafe pointer, nil memory address #dafuc
	// or w/o errors get tileData == nil
	e := GetDB().View(func(tx *bolt.Tx) error {
		bz := tx.Bucket(unsafeCaseInt32ToBytes(int32(zoomLevel)))
		bx := bz.Bucket(unsafeCaseInt32ToBytes(int32(colNum)))
		tileData := bx.Get(unsafeCaseInt32ToBytes(int32(rowNum)))
		if tileData == nil {
			fmt.Println("td war nil", z, x, y)
		} else {
			w.Write(tileData)
		}
		return nil
	})
	if e != nil {
		fmt.Println("getdb", e)
	}

	// //dafuc 2
	// rows, err := db.Query("SELECT * FROM tiles WHERE zoom_level = ?  AND tile_column = ? AND tile_row = ?", z, x, qrows)
	// if err != nil {
	// 	fmt.Print(err.Error())

	// }
	// for rows.Next() {

	// 	var zoom_level int32
	// 	var tile_column int32
	// 	var tile_row int32
	// 	var tile_data []byte
	// 	rows.Scan(&zoom_level, &tile_column, &tile_row, &tile_data) //tile_data blob)
	// 	w.Write(tile_data)
	// }

	// db.Close()
}
