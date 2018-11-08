package note

import (
	"encoding/json"
	"errors"
	"time"
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
	ArrivalTime         time.Time
	ArrivalTimeString   string `json:"arrivalDate"`
	DepartureTime       time.Time
	DepartureTimeString string `json:"departureDate"`
	Place               string `json:"place"`
	Valid               bool   `json:"validVisit"`
}
