package main

import (
	"database/sql"
	"encoding/binary"
	"flag"
	"fmt"
	"github.com/boltdb/bolt"
	"github.com/cheggaaa/pb"
	_ "github.com/mattn/go-sqlite3"
	"path"
)

var (
	db             *bolt.DB
	trackKey       = "tracks"
	undumpTrackKey = "mbtracks"
)

// GetDB is db getter.
func getDB() *bolt.DB {
	return db
}

// string arg for da cattrack main to rid dis
func dumpInitBoltDB(boltDb string) error {

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

func insertToBolt(zoom_level int32, tile_column int32, tile_row int32, tile_data []byte) error {

	e := getDB().Update(func(tx *bolt.Tx) error {
		// bucket:mbTracks -> bucket:z
		zb, ze := tx.CreateBucketIfNotExists(i32tob(zoom_level))
		if ze != nil {
			fmt.Println("zoom bucket creator", ze)
		}

		// bucket:z -> bucket:x
		xb, xe := zb.CreateBucketIfNotExists(i32tob(tile_column))
		if xe != nil {
			fmt.Println("x bucket creator", xe)
		}

		// bucket:x key:y = val:tile
		pe := xb.Put(i32tob(tile_row), tile_data)
		if pe != nil {
			fmt.Println("yk putter", pe)
		}
		return pe
	})

	return e

}

func checkCount(rows *sql.Rows) (count int) {
	for rows.Next() {
		err := rows.Scan(&count)
		if err != nil {
			fmt.Println(err)
		}
	}
	return count
}

func mbtilesToBolt(mbtilesPath string, boltPath string) {

	dumpInitBoltDB(boltPath)

	// read all rows from .mbtiles with sqlite3
	db, err := sql.Open("sqlite3", mbtilesPath) //"./tiles.mbtiles")
	if err != nil {
		fmt.Print(err.Error())

	}

	crows, _ := db.Query("SELECT COUNT(*) as count FROM tiles")
	// fmt.Println("Total count:", checkCount(rows))
	count := checkCount(crows)
	bar := pb.StartNew(count)

	// for each row, will set bucket:mbTiles -> bucket:z -> bucket:x -> key:y = value:tile_data blob
	rows, err := db.Query("SELECT * FROM tiles")
	if err != nil {
		fmt.Print(err.Error())

	}

	for rows.Next() {

		var zoom_level int32
		var tile_column int32
		var tile_row int32
		var tile_data []byte
		rows.Scan(&zoom_level, &tile_column, &tile_row, &tile_data) //tile_data blob)
		insertToBolt(zoom_level, tile_column, tile_row, tile_data)
		bar.Increment()
	}
	bar.Finish()
}

// transfers data from .mbtiles/sqlite3 file to boltdb.db file
func main() {
	var boltDb string
	var mbTilesPath string

	flag.StringVar(&boltDb, "db", path.Join("./", "tracks.db"), "db to create/edit")
	flag.StringVar(&mbTilesPath, "tiles", path.Join("./", "tiles.mbtiles"), ".mbtiles file to read from")
	flag.Parse()
	fmt.Println("Reading ", mbTilesPath, " back into ", boltDb)
	mbtilesToBolt(mbTilesPath, boltDb)
}