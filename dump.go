package main

//dump a bolty db to trackpoints
import (
	"encoding/json"
	"flag"
	"fmt"
	"github.com/boltdb/bolt"
	"github.com/rotblauer/trackpoints/trackPoint"
	"path"

	"github.com/fatih/structs"
	"github.com/kpawlik/geojson"
	"io/ioutil"
	"os"
	"os/exec"
)

var (
	db       *bolt.DB
	trackKey = "tracks"
)

// GetDB is db getter.
func getDB() *bolt.DB {
	return db
}

// string arg for da cattrack main to rid dis
func initBoltDB(boltDb string) error {

	var err error
	db, err = bolt.Open(boltDb, 0666, nil)

	// return err
	if err != nil {
		fmt.Println("Could not initialize Bolt database. ", err)
	} else {
		fmt.Println("Bolt db is initialized.")
		db.Update(func(tx *bolt.Tx) error {
			// "tracks" -- this is the default bucket, keyed on time.UnixNano
			_, e := tx.CreateBucketIfNotExists([]byte(trackKey))
			if e != nil {
				return e
			}
			_, e = tx.CreateBucketIfNotExists([]byte("names"))
			if e != nil {
				return e
			}
			return e
		})
	}
	return err
	// return GetDB()
}

func dumpBolty(boltDb string, out string) {


	initBoltDB(boltDb)
	file, err := os.Create(out + ".json")
	if err != nil {
		fmt.Println("Can't create file.", err)
	}
	defer file.Close()


	//TODO split feature collections ala trackpointer Big Papa Mama namer

	fc := geojson.NewFeatureCollection([]*geojson.Feature{})



	//tippy process
	//Mapping extremely dense point data with vector tiles
	//https://www.mapbox.com/blog/vector-density/
	//-z19 -d11 -g3
	//"--no-tile-size-limit"
	tippmycanoe := exec.Command("tippecanoe","-ag","-pk","--drop-rate","0","--maximum-zoom","50","-g","1.5","-n","catTrack", "-o", out+".mbtiles")
	tippmycanoeIn, _ := tippmycanoe.StdinPipe()

	err = getDB().View(func(tx *bolt.Tx) error {
		var err error
		b := tx.Bucket([]byte(trackKey))
		b.ForEach(func(trackPointKey, trackPointVal []byte) error {

			var trackPointCurrent trackPoint.TrackPoint
			json.Unmarshal(trackPointVal, &trackPointCurrent)

			// convert to a feature
			p := geojson.NewPoint(geojson.Coordinate{geojson.Coord(trackPointCurrent.Lng),geojson.Coord(trackPointCurrent.Lat)})
			props := structs.Map(trackPointCurrent) // dats a lazy one
			f1 := geojson.NewFeature(p, props,1)


			fc.AddFeatures(f1)

			return nil

		})

		return err
	})

	if err != nil {
		fmt.Println("what da dump", err)
	}

	data, err := json.Marshal(fc)
	if err != nil {
	}
	tippmycanoe.Stdout = os.Stdout
	tippmycanoe.Stderr = os.Stderr

	err = tippmycanoe.Start()
	if err != nil {
		fmt.Fprintln(os.Stderr, "Error starting Cmd", err)
		os.Exit(1)
	}

	tippmycanoeIn.Write(data)
	tippmycanoeIn.Close()

	err2 := ioutil.WriteFile(out+".json", data, 0644)
	if err2 != nil {
		fmt.Println("could not write to "+out, err)

	}
}

func main() {

	//#brew install tippecanoe

	var boltDb string
	var out string

	flag.StringVar(&boltDb, "in", path.Join("./", "tracks.db"), "specify the input bolt db holding trackpoints")
	flag.StringVar(&out, "out", "out", "base name of the output")
	fmt.Println("Dumping " + boltDb + " to " + out + ".json/.mbtile")
	flag.Parse()
	dumpBolty(boltDb, out)
}
