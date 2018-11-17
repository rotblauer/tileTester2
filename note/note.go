package note

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	gm "googlemaps.github.io/maps"
)

// private func objectifyNote(n: Note) -> NSMutableDictionary? {
// 	let dict = NSMutableDictionary()
// 	dict.setValue(n.activity.rawValue, forKey: "activity");  //set all your values..
// 	dict.setValue(n.numberOfSteps, forKey: "numberOfSteps");
// 	dict.setValue(n.averageActivePace, forKey: "averageActivePace");
// 	dict.setValue(n.currentPace, forKey: "currentPace");
// 	dict.setValue(n.currentCadence, forKey: "currentCadence");
// 	dict.setValue(n.distance, forKey: "distance");
// 	dict.setValue(n.customNote, forKey: "customNote");
// 	dict.setValue(n.floorsAscended, forKey: "floorsAscended");
// 	dict.setValue(n.floorsDescended, forKey: "floorsDescended");
// 	dict.setValue(n.currentTripStart.iso8601, forKey: "currentTripStart");
// 	dict.setValue(n.relativeAltitude, forKey: "relativeAltitude");
// 	dict.setValue(n.pressure, forKey: "pressure");
// 	dict.setValue(getStringVisit(v:n.currentVisit), forKey: "visit");

// 	return dict
// }

// type Note struct {
// 	Activity          string      `json:"activity"`
// 	NumberOfSteps     int         `json:"numberOfSteps"`
// 	Pressure          float64     `json:"pressure"`
// 	AverageActivePace float64     `json:"averageActivePace"`
// 	CustomNote        interface{} `json:"customNote"`
// }

var ErrNilNote = errors.New("nil note")

type NotesField []byte

// // MarshalJSON returns *m as the JSON encoding of m.
// func (m *NotesField) MarshalJSON() ([]byte, error) {
// 	return []byte(*m), nil
// }

// // UnmarshalJSON sets *m to a copy of data.
// func (m *NotesField) UnmarshalJSON(data []byte) error {
// 	if m == nil {
// 		return errors.New("RawString: UnmarshalJSON on nil pointer")
// 	}
// 	*m += RawString(data)
// 	return nil
// }

type NoteString string

func (nf NotesField) AsNoteString() string {
	if nf == nil {
		return ""
	}
	return string(nf)
}

type NoteFingerprint struct {
	fingerprintMD5  string `json:"fingerprintHashMD5"`
	fingerprint_MD5 string `json:"fingerprintHash"`
}

func (nf NotesField) AsFingerprint() (fing NoteFingerprint, err error) {
	if nf == nil {
		err = ErrNilNote
		return
	}
	err = json.Unmarshal(nf, &fing)
	return
}

func (fp NoteFingerprint) Value() []byte {
	if fp.fingerprint_MD5 == "" {
		return []byte(fp.fingerprintMD5)
	}
	return []byte(fp.fingerprint_MD5)
}

type NoteStructured struct {
	Activity          string      `json:"activity"`
	NumberOfSteps     int         `json:"numberOfSteps"`
	AverageActivePace float64     `json:"averageActivePace"`
	CurrentPace       float64     `json:"currentPace"`
	CurrentCadence    float64     `json:"currentCadence"`
	Distance          float64     `json:"distance"`
	CustomNote        string      `json:"customNote"` // FIXME: string or float64?
	FloorsAscended    int         `json:"floorsAscended"`
	FloorsDescended   int         `json:"floorsDescended"`
	CurrentTripStart  time.Time   `json:"currentTripStart"`
	Pressure          float64     `json:"pressure"`
	Visit             VisitString `json:"visit"`
}

type VisitString string

func (vs VisitString) AsVisit() (v NoteVisit, err error) {
	err = json.Unmarshal([]byte(vs), &v)
	if err != nil {
		return
	}
	v.ArrivalTime, err = time.Parse(time.RFC3339Nano, v.ArrivalTimeString)
	if err != nil {
		return
	}
	v.DepartureTime, err = time.Parse(time.RFC3339Nano, v.DepartureTimeString)
	return
}

func (nf NotesField) AsNoteStructured() (ns NoteStructured, err error) {
	if nf == nil {
		err = ErrNilNote
		return
	}
	err = json.Unmarshal(nf, &ns)
	return
}

func (ns NoteStructured) HasVisit() bool {
	v, err := ns.Visit.AsVisit()
	if err != nil {
		return false
	}
	// if v.ArrivalTime.IsZero() {
	// 	panic("zero arrivals")
	// }
	if v.ArrivalTime.IsZero() && v.DepartureTime.IsZero() {
		return false
	}
	return v.Place != ""
}

func (ns NoteStructured) HasValidVisit() bool {
	if !ns.HasVisit() {
		return false
	}
	v, _ := ns.Visit.AsVisit()
	return v.Valid
}

type NoteVisit struct {
	Uuid                string `json:"uuid"` // kind of optional
	Name                string `json:"name"` // kind of optional
	ArrivalTime         time.Time
	ArrivalTimeString   string `json:"arrivalDate"`
	DepartureTime       time.Time
	DepartureTimeString string      `json:"departureDate"`
	Place               PlaceString `json:"place"`
	PlaceParsed         Place
	Valid               bool `json:"validVisit"`
	ReportedTime        time.Time
	Duration            time.Duration
	GoogleNearby        *gm.PlacesSearchResponse `json:"googleNearby,omitempty"`
}

func (nv NoteVisit) GetDuration() time.Duration {
	calend := nv.DepartureTime
	// seen "departureDate\":\"4001-01-01T00:00:00.000Z\"}
	if nv.DepartureTime.Year() == 4001 || nv.DepartureTime.After(time.Now().Add(24*365*time.Hour)) {
		calend = time.Now()
	}
	return calend.Sub(nv.ArrivalTime)
}

func (visit NoteVisit) GoogleNearbyQ() (res *gm.PlacesSearchResponse, err error) {

	// ios radius for visit is cautious, and google is prolific. thus, optimism. high number = small google radius param
	// raw radius numbers are typically 140 or 70 meters
	var divideRadius = 2.0

	res = &gm.PlacesSearchResponse{}
	u, err := url.Parse("https://maps.googleapis.com/maps/api/place/nearbysearch/json")
	if err != nil {
		log.Println("could not parse google url", err)
		return res, err
	}
	q := u.Query()
	q.Set("location", fmt.Sprintf("%.14f,%.14f", visit.PlaceParsed.Lat, visit.PlaceParsed.Lng))
	var r float64
	r = visit.PlaceParsed.Radius
	if r == 0 {
		r = visit.Place.GetRadius()
	}
	if r == 0 {
		r = 50
	}
	r = r / divideRadius
	q.Set("radius", fmt.Sprintf("%.2f", r))

	q.Set("rankby", "prominence") // also distance, tho distance needs name= or type= or somethin

	q.Set("key", os.Getenv("GOOGLE_PLACES_API_KEY"))

	u.RawQuery = q.Encode()

	// log.Println("query => ", u.String())

	re, err := http.Get(u.String())
	if err != nil {
		log.Println("error google nearby http req", err)
		return res, err
	}

	err = json.NewDecoder(re.Body).Decode(&res)
	// b := []byte{}
	// _, err = re.Body.Read(b)
	// if err != nil {
	// 	log.Println("could not read res body", err)
	// 	return res, err
	// }
	// re.Body.Close()

	// // unmarshal
	// err = json.Unmarshal(b, &res)
	return
}

// 25 Yeadon Ave, 25 Yeadon Ave, Charleston, SC  29407, United States @ <+32.78044829,-79.98285770> +\\\/- 100.00m, region CLCircularRegion (identifier:'<+32.78044828,-79.98285770> radius 141.76', center:<+32.78044828,-79.98285770>, radius:141.76m)
type PlaceString string

type Place struct {
	Identity string
	Address  string
	Lat      float64
	Lng      float64
	Acc      float64
	Radius   float64
}

func (ps PlaceString) GetRadius() float64 {
	r := strings.Split(string(ps), "radius:")[1]
	// log.Println("r1", r)

	r = strings.Split(r, "m")[0]
	// log.Println("r2", r)

	rn, err := strconv.ParseFloat(r, 64)
	if err != nil {
		return 0
	}
	return rn
}

func (ps PlaceString) AsPlace() (p Place, err error) {
	// slices will panic if oob
	commas := strings.Split(string(ps), ",")
	p.Identity = commas[0]
	p.Address = strings.Split(string(ps), "@")[0] // TODO: remove 'identity' prefix?

	s1 := strings.Split(string(ps), "<")[1]
	s1 = strings.Split(s1, ">")[0]
	ll := strings.Split(s1, ",")
	lat := strings.TrimPrefix(ll[0], "+")
	lng := strings.TrimPrefix(ll[1], "+")

	p.Lat, err = strconv.ParseFloat(lat, 64)
	if err != nil {
		return
	}
	p.Lng, err = strconv.ParseFloat(lng, 64)
	if err != nil {
		return
	}

	p.Radius = ps.GetRadius()

	// TODO p.Acc, p.Radius
	return
}

func (ps PlaceString) MustAsPlace() Place {
	p, _ := ps.AsPlace()
	return p
}
