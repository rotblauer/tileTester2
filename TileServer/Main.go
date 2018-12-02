package main

import (
	"flag"
	"log"
	"net/http"
	_ "net/http/pprof"
	"path"
)

var mbtilesBoltDBPathMaster string
var mbtilesBoltDBPathDevop string
var mbtilesBoltDBPathEdge string
var mbtilesBoltDBPathPlaces string
var port string

func main() {

	// sigc := make(chan os.Signal, 1)
	// signal.Notify(sigc,
	// 	syscall.SIGHUP,
	// 	syscall.SIGINT,
	// 	syscall.SIGTERM,
	// 	syscall.SIGQUIT)

	flag.StringVar(&mbtilesBoltDBPathMaster, "db", path.Join("./", "tiles.db"), "rel path of bolt db containing vector mbtiles file to serve")
	flag.StringVar(&mbtilesBoltDBPathDevop, "db-devop", path.Join("./", "tiles-devop.db"), "rel path of bolt db containing vector mbtiles file to serve")
	flag.StringVar(&mbtilesBoltDBPathEdge, "db-edge", path.Join("./", "tiles-edge.db"), "rel path of bolt db containing vector mbtiles file to serve")
	flag.StringVar(&mbtilesBoltDBPathPlaces, "db-places", path.Join("./", "tiles-places.db"), "rel path of bolt places")

	flag.StringVar(&port, "port", "8080", "port to serve on")
	flag.Parse()

	// f, err := os.Create(filepath.Join(os.Getenv("HOME"), "tdata", "pf.pb.gz"))
	// if err != nil {
	// 	log.Fatal(err)
	// }
	// if err := pprof.StartCPUProfile(f); err != nil {
	// 	log.Fatal(err)
	// }

	// go func() {
	// 	err, s := http.ListenAndServe("localhost:6060", nil), <-sigc
	// 	for {
	// 		if err != nil {
	// 			log.Println("prprof serv err=", err)
	// 			return
	// 		}
	// 		if s != nil {
	// 			log.Println("caught interrupt", s)
	// 			return
	// 		}
	// 	}
	// }()

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
	if bolterr := InitBoltDB("places", mbtilesBoltDBPathPlaces); bolterr == nil {
		defer GetDB("places").Close()
	} else {
		log.Println(bolterr)
	}
	log.Println("Serving on :", port)
	log.Fatal(http.ListenAndServe(":"+port, router))
}
