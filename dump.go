package main

//dump a bolty db to trackpoints
import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"path"

	"github.com/coreos/bbolt"
	"github.com/rotblauer/trackpoints/trackPoint"

	"os"
	"os/exec"

	"github.com/kpawlik/geojson"
	"github.com/rotblauer/tileTester2/undump"

	"compress/gzip"
	"runtime/pprof"
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
	// db, err = bolt.Open(boltDb, 0666, &bolt.Options{ReadOnly: true})
	// &bolt.Options{}
	// db.NoFreelistSync = true
	// db.NoGrowSync = true
	// db.NoSync = true
	// db.AllocSize = 32 * 1024 * 1024

	dbstats := db.Stats()
	fmt.Printf("DB stats: %v\n", dbstats)

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
}

type F struct {
	f  *os.File
	gf *gzip.Writer
	je *json.Encoder
}

func CreateGZ(s string, compressLevel int) (f F) {

	fi, err := os.OpenFile(s, os.O_WRONLY|os.O_APPEND|os.O_CREATE, 0660)
	if err != nil {
		log.Printf("Error in Create file\n")
		panic(err)
	}
	gf, err := gzip.NewWriterLevel(fi, compressLevel)
	if err != nil {
		log.Printf("Error in Create gz \n")
		panic(err)
	}
	je := json.NewEncoder(gf)
	f = F{fi, gf, je}
	return
}

func CloseGZ(f F) {
	// Close the gzip first.
	f.gf.Flush()
	f.gf.Close()
	f.f.Close()
}

func byteToFeature(val []byte) *geojson.Feature {
	var trackPointCurrent trackPoint.TrackPoint
	if e := json.Unmarshal(val, &trackPointCurrent); e != nil {
		log.Fatalln(e)
	}

	// convert to a feature
	p := geojson.NewPoint(geojson.Coordinate{geojson.Coord(trackPointCurrent.Lng), geojson.Coord(trackPointCurrent.Lat)})

	//currently need speed, name,time
	trimmedProps := make(map[string]interface{})
	trimmedProps["Speed"] = trackPointCurrent.Speed
	trimmedProps["Name"] = trackPointCurrent.Name
	trimmedProps["Time"] = trackPointCurrent.Time
	trimmedProps["Elevation"] = trackPointCurrent.Elevation
	trimmedProps["Notes"] = trackPointCurrent.Notes
	return geojson.NewFeature(p, trimmedProps, 1)
}

func dumpBolty(boltDb string, out string, compressLevel int, batchSize int) error {

	initBoltDB(boltDb)
	// If the file doesn't exist, create it, or append to the file
	f := CreateGZ(out+".json.gz", compressLevel)
	count := 0

	byteChan := make(chan []byte, 100000)
	featureChan := make(chan *geojson.Feature, 100000)
	done := make(chan bool)

	go func() {
		for byteFeature := range byteChan {
			featureChan <- byteToFeature(byteFeature)
		}
		close(featureChan)
	}()

	go func() {
		for feature := range featureChan {
			f.je.Encode(feature)
			count++
			if count%batchSize == 0 {
				fmt.Println("Dumped ", count, " total tracked points.")
			}
		}
		done <- true
	}()

	go func() {
		err := getDB().View(func(tx *bolt.Tx) error {
			var err error
			b := tx.Bucket([]byte(trackKey))
			if b == nil {
				panic("no bucket under key=" + trackKey + " err=" + err.Error())
			}

			c := b.Cursor()

			// get all trackpoints
			for k, tp := c.First(); k != nil; k, tp = c.Next() {
				byteChan <- tp
			}

			return err
		})

		if err != nil {
			log.Println("what da dump", err)
		}
		close(byteChan)
	}()

	<-done

	CloseGZ(f)

	//
	//
	//tippCmd, tippargs := getTippyProcess(out)
	//fmt.Println(">", tippCmd, tippargs)
	//tippmycanoe := exec.Command(tippCmd, tippargs...)
	//
	//tippmycanoeIn, _ := tippmycanoe.StdinPipe()
	//tippmycanoe.Stdout = os.Stdout
	//tippmycanoe.Stderr = os.Stderr
	//
	//err := tippmycanoe.Start()
	//if err != nil {
	//	fmt.Fprintln(os.Stderr, "Error starting Cmd", err)
	//	os.Exit(1)
	//}
	//
	//fc := geojson.NewFeatureCollection([]*geojson.Feature{})
	//
	//if len(fc.Features) > 0 {
	//	data, err := json.Marshal(fc)
	//	if err != nil {
	//		log.Println("finish, err marshalling json geo data:", err)
	//	}
	//	tippmycanoeIn.Write(data)
	//	(f.fw).Write(data)
	//	CloseGZ(f)
	//}
	//tippmycanoeIn.Close()
	//
	//return tippmycanoe.Wait()

	return nil
}

func main() {

	//#brew install tippecanoe && brew upgrade tippecanoe

	var boltDb string
	var out string
	var boldDBOut string
	var cpuprofile string
	var batchSize int
	var compressLevel int

	flag.StringVar(&boltDb, "in", path.Join("./", "tracks.db"), "specify the input bolt db holding trackpoints")
	flag.StringVar(&out, "out", "out", "base name of the output")
	flag.StringVar(&boldDBOut, "boltout", "tippedcanoetrack.db", "output bold db holding tippecanoe-ified trackpoints, which is a vector tiled db for /z/x/y")
	flag.StringVar(&cpuprofile, "cpuprofile", "", "write cpu profile to file, leave blank for no profile")
	flag.IntVar(&compressLevel, "compressLevel", 2, "compression level for gzip")
	flag.IntVar(&batchSize, "batchSize", 100000, "after this many points, dump a batch")

	flag.Parse()

	if cpuprofile != "" {

		fmt.Println("CPU profile heading to ", cpuprofile)
		f, err := os.Create(cpuprofile)
		if err != nil {
			log.Fatal(err)
		}
		pprof.StartCPUProfile(f)
		defer pprof.StopCPUProfile()
	}

	fmt.Println("Dump: Migrating boltdb trackpoints -> geojson/+mbtiles, boltdb:", boltDb, "out:", out+".json/+.mbtiles")
	e := dumpBolty(boltDb, out, compressLevel, batchSize)
	if e != nil {
		fmt.Println("error dumping orignial bolty", e)
	}

	fmt.Println("Dump: Migrating .mbtiles file back into a bolt db: ", boldDBOut)

	undump.MbtilesToBolt(out+".mbtiles", boldDBOut)

}

func getTippyProcess(out string) (tippCmd string, tippargs []string) {
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
	//-f or --force: Delete the mbtiles file if it already exists instead of giving an error
	//
	//WARNINGS:
	//Highest supported zoom with detail 14 is 18
	tippCmd = "/usr/local/bin/tippecanoe"
	tippargs = []string{
		"-ag",
		"-M", "1000000",
		"-O", "200000",
		"--reorder",
		"--cluster-densest-as-needed",
		"-g", "0.1",
		"--full-detail", "14",
		"--minimum-detail", "12",
		"-rg",
		"-rf100000",
		"--minimum-zoom", "3",
		"--maximum-zoom", "20",
		"-n", "catTrack",
		"-o", out + ".mbtiles",
		"--force",
	}
	// Use alternate tippecanoe path if 'bash -c which tippecanoe' returns something without error and different than default
	if b, e := exec.Command("bash -c", "which", "tippecanoe").Output(); e == nil && string(b) != tippCmd {
		tippCmd = string(b)
	}
	return
}
