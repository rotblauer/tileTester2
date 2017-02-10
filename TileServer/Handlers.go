package main

import (
	"database/sql"
	"net/http"

	"github.com/gorilla/mux"
	_ "github.com/mattn/go-sqlite3"
	"fmt"
	"github.com/paulmach/go.vector_tile"
)

func Tiles(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/x-protobuf")
	vars := mux.Vars(r)
	//dbname := vars["db"]
	z := vars["z"]
	x := vars["x"]
	y := vars["y"]
	fmt.Println(z +"\t"+x+"\t"+y)
	db, err := sql.Open("sqlite3", "./tiles.mbtiles") //"./tiles.mbtiles")
	if err !=nil {
		fmt.Print(err.Error())


	}

	//rows, err := db.Query("SELECT * FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?", z, x, y)
	rows, err := db.Query("SELECT * FROM tiles WHERE zoom_level = ? AND tile_column = ? ",z,x)

	if err !=nil {
		fmt.Print(err.Error())


	}
	fmt.Print("DFD")
	for rows.Next() {

		var zoom_level int32
		var tile_column int32
		var tile_row int32
		var tile_data []byte
		rows.Scan(&zoom_level, &tile_column, &tile_row, &tile_data) //tile_data blob)
		//fmt.Println(string(tile_data))
		//des suckers are gzipped sneaky buggers
		var tile,erro = vector_tile.DecodeGzipped(tile_data)
		if erro!=nil{
			fmt.Println(erro.Error())
		}

		//fmt.Println(tile.GetLayers())
		fmt.Println(tile.Layers[0].Name)
		var unzi,_ =vector_tile.Encode(tile)
		w.Write(unzi)
	}

	db.Close()

}
