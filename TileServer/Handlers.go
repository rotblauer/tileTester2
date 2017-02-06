package main

import (
	"database/sql"
	"net/http"

	"github.com/gorilla/mux"
	_ "github.com/mattn/go-sqlite3"
)

func Tiles(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "image/png")
	vars := mux.Vars(r)
	//dbname := vars["db"]
	z := vars["z"]
	x := vars["x"]
	y := vars["y"]
	db, _ := sql.Open("sqlite3", "./tiles.mbtiles") //"./tiles.mbtiles")
	rows, _ := db.Query("SELECT * FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?", z, x, y)

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
