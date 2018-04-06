package main

//dump a bolty db to trackpoints
import (
	"encoding/json"
	"flag"
	"fmt"
	"path"

	"github.com/boltdb/bolt"
	"github.com/rotblauer/trackpoints/trackPoint"

	"io/ioutil"
	"os"
	"os/exec"

	"github.com/kpawlik/geojson"
	"github.com/rotblauer/tileTester2/undump"
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

func dumpBolty(boltDb string, out string) error {

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
	//-as or --drop-densest-as-needed: If a tile is too large, try to reduce it to under 500K by increasing the minimum spacing between features. The discovered spacing applies to the entire zoom level.
	//-ag or --calculate-feature-density: Add a new attribute, tippecanoe_feature_density, to each feature, to record how densely features are spaced in that area of the tile. You can use this attribute in the style to produce a glowing effect where points are densely packed. It can range from 0 in the sparsest areas to 255 in the densest.
	//-pk or --no-tile-size-limit: Don't limit tiles to 500K bytes
	//-pf or --no-feature-limit: Don't limit tiles to 200,000 features
	//-pd or --force-feature-limit: Dynamically drop some fraction of features from large tiles to keep them under the 500K size limit. It will probably look ugly at the tile boundaries. (This is like -ad but applies to each tile individually, not to the entire zoom level.) You probably don't want to use this.
	//-r rate or --drop-rate=rate: Rate at which dots are dropped at zoom levels below basezoom (default 2.5). If you use -rg, it will guess a drop rate that will keep at most 50,000 features in the densest tile. You can also specify a marker-width with -rgwidth to allow fewer features in the densest tile to compensate for the larger marker, or -rfnumber to allow at most number features in the densest tile.
	//-z zoom or --maximum-zoom=zoom: Don't copy tiles from higher zoom levels than the specified zoom
	//-g gamma or --gamma=_gamma_: Rate at which especially dense dots are dropped (default 0, for no effect). A gamma of 2 reduces the number of dots less than a pixel apart to the square root of their original number.
	//-n name or --name=name: Set the tileset name
	//-ao or --reorder: Reorder features to put ones with the same properties in sequence, to try to get them to coalesce. You probably want to use this if you use --coalesce.
	//-aC or --cluster-densest-as-needed: If a tile is too large, try to reduce its size by increasing the minimum spacing between features, and leaving one placeholder feature from each group. The remaining feature will be given a "cluster": true attribute to indicate that it represents a cluster, a "point_count" attribute to indicate the number of features that were clustered into it, and a "sqrt_point_count" attribute to indicate the relative width of a feature to represent the cluster. If
	//- the features being clustered are points, the representative feature will be located at the average of the original points' locations; otherwise, one of the original features will be left as the representative
	//-M bytes or --maximum-tile-bytes=bytes: Use the specified number of bytes as the maximum compressed tile size instead of 500K.
	//-O features or --maximum-tile-features=features: Use the specified number of features as the maximum in a tile instead of 200,000.
	//
	//WARNINGS:
	//Highest supported zoom with detail 14 is 18
	tippmycanoe := exec.Command("tippecanoe", "-ag", "-pk", "--reorder", "--cluster-densest-as-needed", "-g", "0.1", "--full-detail", "14", "--minimum-detail", "12", "-rg", "-rf", "200000" "--minimum-zoom", "3", "--maximum-zoom", "20", "-n", "catTrack", "-o", out+".mbtiles")
	// tippmycanoe := exec.Command("tippecanoe", "-ag", "-pk", "-pf", "--drop-rate", "0", "--maximum-zoom", "50", "-g", "0.25", "-n", "catTrack", "-o", out+".mbtiles")
	// tippmycanoe := exec.Command("tippecanoe", "-ag", "--full-detail", "20", "--low-detail", "14", "--minimum-detail", "8", "--maximum-tile-bytes", "1000000", "--maximum-zoom", "22", "-g", "1", "-n", "catTrack", "-o", out+".mbtiles")
	tippmycanoeIn, _ := tippmycanoe.StdinPipe()

	err = getDB().View(func(tx *bolt.Tx) error {
		var err error
		b := tx.Bucket([]byte(trackKey))

		stats := b.Stats()
		fmt.Println("Tippeing ", stats.KeyN, " total tracked points.")

		b.ForEach(func(trackPointKey, trackPointVal []byte) error {

			var trackPointCurrent trackPoint.TrackPoint
			json.Unmarshal(trackPointVal, &trackPointCurrent)

			// convert to a feature
			p := geojson.NewPoint(geojson.Coordinate{geojson.Coord(trackPointCurrent.Lng), geojson.Coord(trackPointCurrent.Lat)})
			//currently need speed, name,time
			trimmedProps := make(map[string]interface{})
			trimmedProps["Speed"] = trackPointCurrent.Speed
			trimmedProps["Name"] = trackPointCurrent.Name
			trimmedProps["Time"] = trackPointCurrent.Time
			trimmedProps["Elevation"] = trackPointCurrent.Elevation
			f1 := geojson.NewFeature(p, trimmedProps, 1)

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
	return tippmycanoe.Wait()
}

func main() {

	//#brew install tippecanoe
	fmt.Println("Now taking .mbtiles file and putting it back into a bolt db:")

	var boltDb string
	var out string
	var boldDBOut string

	flag.StringVar(&boltDb, "in", path.Join("./", "tracks.db"), "specify the input bolt db holding trackpoints")
	flag.StringVar(&out, "out", "out", "base name of the output")
	flag.StringVar(&boldDBOut, "boltout", "tippedcanoetrack.db", "output bold db holding tippecanoe-ified trackpoints, which is a vector tiled db for /z/x/y")
	fmt.Println("Dumping " + boltDb + " to " + out + ".json/.mbtile")
	flag.Parse()
	e := dumpBolty(boltDb, out)
	if e != nil {
		fmt.Println("error dumping orignial bolty", e)
	}

	fmt.Println("Now taking .mbtiles file and putting it back into a bolt db: ", boldDBOut)

	undump.MbtilesToBolt(out+".mbtiles", boldDBOut)

}
