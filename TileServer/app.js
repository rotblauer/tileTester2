var map = L.map('map', {
    maxZoom: 20
}).setView([38.6270, -90.1994], 12);

var url = 'http://punktlich.rotblauer.com:8081/tiles/{z}/{x}/{y}';

// http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
function shadeRGBColor(color, percent) {
    var f=color.split(","),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=parseInt(f[0].slice(4)),G=parseInt(f[1]),B=parseInt(f[2]);
    return "rgb("+(Math.round((t-R)*p)+R)+","+(Math.round((t-G)*p)+G)+","+(Math.round((t-B)*p)+B)+")";
}

function radiusFromSpeed(speed) {
    if (typeof(speed) === "undefined") { return 3; }
    if (speed < 0) { speed = 0; }
    return Math.abs( 3 - ( Math.log(speed+0.01) / 2) );
}

var vectorTileOptions = {
    rendererFactory: L.canvas.tile,
    // attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://www.mapbox.com/about/maps/">MapBox</a>',
    vectorTileLayerStyles: {

        'catTrack': function(properties, zoom) {

            var color2 = "rgb(241, 66, 244)"; // purple
            if (properties.Name === "Big Papa" || properties.Name === "ia") color2 = "rgb(200,0,0)"; //red";
            if (properties.Name === "RyePhone" || properties.Name === "jl") color2 = "rgb(0,0,200)"; //blue";
            if (properties.Name === "Big Mamma") color2 = "rgb(0, 200, 0)"; //green";
            if (properties.Name === "Kayleigh's iPhone") color2 = "rgb(200, 200, 0)"; //yellow

            // console.log(properties);
            // Object
            // Accuracy: 10
            // Elevation: 148.8997
            // Heading: 224.3618
            // HeartRate: 0
            // ID: 1485563993509000000
            // Lat: 38.61678
            // Lng: -90.26221
            // Name: "RyePhone"
            // Notes: ""
            // Speed: 11.78
            // Tilt: 0
            // Time: "2017-01-28T00:39:53.509Z"
            // tippecanoe_feature_density: 0

            var maxNormalPossibleSpeed = 15; // m/s, no rockets allowed

            return {
                stroke: false,
                // weight: 1,
                // color: color2,
                // opacity: .05,

                fill: true,
                // lighten it the fast you go
                fillColor: shadeRGBColor(color2, ( ( properties.Speed / maxNormalPossibleSpeed ) % 1.0 ) / 2),
                fillOpacity: 0.1,
                // fillWeight: 0.5,

                // radius: 3,
                radius: radiusFromSpeed(properties.Speed),
                type: "Point"
            }
        },

        water: [],
        //		... any other layers
    },
    interactive: true, // Make sure that this VectorGrid fires mouse/pointer events
    getFeatureId: function(f) {
        return f.properties.name;
    }
};

var mb_light1 = "https://api.mapbox.com/styles/v1/rotblauer/ciy7ijqu3001a2rocq88pi8s4/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoicm90YmxhdWVyIiwiYSI6ImNpeTdidjZxajAwMzEycW1waGdrNmh3NmsifQ.OpXHPqEHK2sTbQ4-pmhAMQ";
L.tileLayer(mb_light1, {
    maxZoom: 22
}).addTo(map);

var highlight;
var clearHighlight = function() {
    if (highlight) {
        pbfLayer.resetFeatureStyle(highlight);
    }
    highlight = null;
};
var pbfLayer = L.vectorGrid.protobuf(url, vectorTileOptions).addTo(map) // It would be nice if this could handle the zipper data instead of unxip on sever

.on('click', function(e) {	// The .on method attaches an event handler
   L.popup()
        .setContent(( e.layer.properties.Name || e.layer.properties.Type )
                    + "<br/> "
                    + "Speed: " + e.layer.properties.Speed + "m/s" + "<br/>"
                    + "Heading: " + e.layer.properties.Heading + "deg" + "<br/>"
                    + "Elevation: " + e.layer.properties.Elevation + "m " + "<br/>"
                    + "Accuracy: +/-" + e.layer.properties.Accuracy + "m" + "<br/>"
                    + e.layer.properties.Time
                   )
       .setLatLng(e.latlng)
       .openOn(map);
   clearHighlight();
   highlight = e.layer.properties.Name;
   pbfLayer.setFeatureStyle(highlight, {
       weight: 2,
       color: 'red',
       opacity: 1,
       fillColor: 'red',
       fill: true,
       radius: 6,
       fillOpacity: 1
   })
   L.DomEvent.stop(e);
});


document.getElementById("gostl").onclick = function() {
    map.setView([38.627, -90.1994], 12);
}
document.getElementById("gober").onclick = function() {
    map.setView([52.484777, 13.445776], 12);
}
document.getElementById("gowww").onclick = function() {
    map.setView([43.582793, -45.353025], 3);
}
