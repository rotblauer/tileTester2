package main

//dump a bolty db to trackpoints
import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"path"
	"strings"

	bolt "github.com/etcd-io/bbolt"

	"os"

	"github.com/kpawlik/geojson"

	"compress/gzip"
	"runtime/pprof"

	"github.com/rotblauer/catTracks/catTracks"
	"github.com/rotblauer/trackpoints/trackPoint"
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
	// db, err = bolt.Open(boltDb, 0666, nil)
	db, err = bolt.Open(boltDb, 0666, &bolt.Options{ReadOnly: true})
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
	fi, err := os.OpenFile(s, os.O_WRONLY|os.O_CREATE, 0660)
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

func dumpBolty(boltDb string, out string, compressLevel int, batchSize int, tilesetname string) error {
	initBoltDB(boltDb)

	// If the file doesn't exist, create it, or append to the file
	jsonGzTracks := out
	if !strings.HasSuffix(out, ".json.gz") {
		jsonGzTracks = jsonGzTracks + ".json.gz"
	}

	f := CreateGZ(jsonGzTracks, compressLevel)
	count := 0

	fmt.Print("\nDumping tracks")

	featureChan := make(chan *geojson.Feature, 100000)
	done := make(chan bool)

	go func() {
		for feature := range featureChan {
			f.je.Encode(feature)
			count++
			if count%batchSize == 0 {
				fmt.Println(count, "points")
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
				t := &trackPoint.TrackPoint{}
				err = json.Unmarshal(tp, &t)
				if err != nil {
					return err
				}
				featureChan <- catTracks.TrackToFeature(t)
			}

			return err
		})

		if err != nil {
			log.Println("what da dump", err)
		}
		close(featureChan)
	}()

	<-done

	CloseGZ(f)
	return nil
}

func main() {
	var boltDb string
	var out string
	var boldDBOut string
	var cpuprofile string
	var batchSize int
	var compressLevel int
	var tipponly bool
	var tilesetName string

	flag.StringVar(&boltDb, "in", path.Join("./", "tracks.db"), "specify the input bolt db holding trackpoints")
	flag.StringVar(&out, "out", "out", "base name of the output")
	flag.StringVar(&boldDBOut, "boltout", "tippedcanoetrack.db", "output bold db holding tippecanoe-ified trackpoints, which is a vector tiled db for /z/x/y")
	flag.StringVar(&cpuprofile, "cpuprofile", "", "write cpu profile to file, leave blank for no profile")
	flag.IntVar(&compressLevel, "compressLevel", gzip.BestCompression, "compression level for gzip")
	flag.IntVar(&batchSize, "batchSize", 100000, "report dumping progress after this many trackpoints")
	flag.BoolVar(&tipponly, "tipponly", false, "only run the tippe command and put mbtiles back to bolty (no dumping original tracks.db to json.gz)")
	flag.StringVar(&tilesetName, "tileset-name", "catTrack", "name for tippe to use as tileset name")

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

	e := dumpBolty(boltDb, out, compressLevel, batchSize, tilesetName)
	if e != nil {
		fmt.Println("error dumping orignial bolty", e)
	}
}
