package main

import (
	"database/sql"
	"net/http"

	"fmt"

	"github.com/gorilla/mux"
	_ "github.com/mattn/go-sqlite3"
	// "github.com/paulmach/go.vector_tile"
	//"strconv"
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
