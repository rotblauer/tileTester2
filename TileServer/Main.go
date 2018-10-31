package main

import (
	"flag"
	"log"
	"net/http"
	"path"
)

var mbtilesBoltDBPathMaster string
var mbtilesBoltDBPathDevop string
var mbtilesBoltDBPathEdge string
var port string

func main() {

	flag.StringVar(&mbtilesBoltDBPathMaster, "db", path.Join("./", "tiles.db"), "rel path of bolt db containing vector mbtiles file to serve")
	flag.StringVar(&mbtilesBoltDBPathDevop, "db-devop", path.Join("./", "tiles-devop.db"), "rel path of bolt db containing vector mbtiles file to serve")
	flag.StringVar(&mbtilesBoltDBPathEdge, "db-edge", path.Join("./", "tiles-edge.db"), "rel path of bolt db containing vector mbtiles file to serve")
	flag.StringVar(&port, "port", "8080", "port to serve on")
	flag.Parse()

	router := NewRouter()

	if bolterr := InitBoltDB("master", mbtilesBoltDBPathMaster); bolterr == nil {
		defer GetDB("master").Close()
	} else {
		log.Println(bolterr)
	}
	if bolterr := InitBoltDB("devop", mbtilesBoltDBPathDevop); bolterr == nil {
		defer GetDB("devop").Close()
	} else {
		log.Println(bolterr)
	}
	if bolterr := InitBoltDB("edge", mbtilesBoltDBPathEdge); bolterr == nil {
		defer GetDB("edge").Close()
	} else {
		log.Println(bolterr)
	}

	// if bolterr := InitBoltDB("master", mbtilesBoltDBPathMaster); bolterr == nil {
	// 	GetDB("master").Close()
	// } else {
	// 	log.Println(bolterr)
	// }
	// if bolterr := InitBoltDB("devop", mbtilesBoltDBPathDevop); bolterr == nil {
	// 	GetDB("devop").Close()
	// } else {
	// 	log.Println(bolterr)
	// }
	// if bolterr := InitBoltDB("edge", mbtilesBoltDBPathEdge); bolterr == nil {
	// 	GetDB("edge").Close()
	// } else {
	// 	log.Println(bolterr)
	// }

	log.Println("Serving on :", port)
	log.Fatal(http.ListenAndServe(":"+port, router))

}
