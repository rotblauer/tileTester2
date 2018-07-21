package note

type Note struct {
	Activity          string  `json:"activity"`
	NumberOfSteps     int     `json:"numberOfSteps"`
	Pressure          float64 `json:"pressure"`
	AverageActivePace float64 `json:"averageActivePace"`
	CustomNote        float64 `json:"customNote"`

	//dict.setValue(n.activity.rawValue, forKey: "activity");  //set all your values..
	//dict.setValue(n.numberOfSteps, forKey: "numberOfSteps");
	//dict.setValue(n.averageActivePace, forKey: "averageActivePace");
	//dict.setValue(n.currentPace, forKey: "currentPace");
	//dict.setValue(n.currentCadence, forKey: "currentCadence");
	//dict.setValue(n.distance, forKey: "distance");
	//dict.setValue(n.customNote, forKey: "customNote");
	//dict.setValue(n.floorsAscended, forKey: "floorsAscended");
	//dict.setValue(n.floorsDescended, forKey: "floorsDescended");
	//dict.setValue(n.currentTripStart.iso8601, forKey: "currentTripStart");
	//dict.setValue(n.relativeAltitude, forKey: "relativeAltitude");
	//dict.setValue(n.pressure, forKey: "pressure");
}
