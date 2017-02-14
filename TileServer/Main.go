package main

import (
	"flag"
	"log"
	"net/http"
	"path"
)

func main() {

	var mbtilesBoltDBPath string
	var port string

	flag.StringVar(&mbtilesBoltDBPath, "db", path.Join("./", "tiles.db"), "rel path of bolt db containing vector mbtiles file to serve")
	flag.StringVar(&port, "port", "8080", "port to serve on")
	flag.Parse()

	router := NewRouter()

	if bolterr := InitBoltDB(mbtilesBoltDBPath); bolterr == nil {
		defer GetDB().Close()
	} else {
		log.Println(bolterr)
	}

	log.Println("Serving on :", port)
	log.Fatal(http.ListenAndServe(":"+port, router))

}
