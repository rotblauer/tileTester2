package main

import (
	"log"
	"net/http"
)

func main() {

	router := NewRouter()
	if bolterr := InitBoltDB("./../undump/tester.db"); bolterr == nil {
		defer GetDB().Close()
	} else {
		log.Println(bolterr)
	}

	log.Println("Serving on :8080")
	log.Fatal(http.ListenAndServe(":8080", router))

}
