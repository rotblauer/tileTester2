var url = 'http://punktlich.rotblauer.com:8081/tiles/{z}/{x}/{y}';
// url = 'http://localhost:8080/tiles/{z}/{x}/{y}';

var map = L.map('map', {
    maxZoom: 20
}).setView([38.6270, -90.1994], 12);


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

var speedTileOptions = {
    rendererFactory: L.canvas.tile,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://www.mapbox.com/about/maps/">MapBox</a>',
    vectorTileLayerStyles: {

        'catTrack': function(properties, zoom) {

            var color2 = "rgb(241, 66, 244)"; // purple
            if (properties.Name === "Big Papa" || properties.Name === "ia") color2 = "rgb(200,0,0)"; //red";
            if (properties.Name === "RyePhone" || properties.Name === "jl") color2 = "rgb(0,0,200)"; //blue";
            if (properties.Name === "Big Mamma") color2 = "rgb(0, 200, 0)"; //green";
            if (properties.Name === "Kayleigh's iPhone") color2 = "rgb(200, 200, 0)"; //yellow


            var maxNormalPossibleSpeed = 15; // m/s, no rockets allowed
            var monsterInt =2.01;
            return {
                stroke: false,
                fill: true,
                fillColor: shadeRGBColor(color2, ( ( properties.Speed / maxNormalPossibleSpeed ) % 1.0 ) / 2),
                fillOpacity: 0.10 +properties.tippecanoe_feature_density/monsterInt, //most are zero in high zoomer, but actually range 0-255
                radius: radiusFromSpeed(properties.Speed),
                type: "Point"
            };
        }
    },
    interactive: true, // Make sure that this VectorGrid fires mouse/pointer events
    getFeatureId: function(f) {
        return f.properties.name;
    }
};

var now = new Date().getTime();
// var pastReferenceTime = Date.parse( now - 1000*60*60*24*7 ); // second, min, hour, day, week
var oneDay = 1000*60*60*24;

// var maxDateDiff = now - oneWeek; // diff in millis

var recencyScale = function (props, color) {
    var dateString = props.Time;
    var density = props.tippecanoe_feature_density;
    if (density === 0) { density += 1; }
    var then = new Date(dateString).getTime();
    var diff = now - then;

    // opacity
    // day, 3 days, week, fortnight, month, sixmonth, year
    // 1,   0.8     0.6   0.4        0.2    0.1       0.05
    // radius
    // day, 3 days, week, fortnight, month, sixmonth, year
    // 2    3       4      5         6      7         9
    var opacity=0.05;
    var radius=20;
    var shade=0.8;

    if (diff <= oneDay) { opacity = 0.9; radius = 2; shade = -0.5; }
    else if (diff <= oneDay*3) { opacity = 0.8; radius = 2; shade = -0.2; }
    else if (diff <= oneDay*7) { opacity = 0.6; radius = 3; shade = -0.1 ; }
    else if (diff <= oneDay*14) { opacity = 0.3; radius = 5; shade = 0.2; }
    else if (diff <= oneDay*30) { opacity = 0.15; radius = 10; shade = 0.5; }
    else if (diff <= oneDay*150) { opacity = 0.09; radius = 15; shade = 0.7; }

    return {
        opacity: opacity, //opacity / 3,
        radius: 2,
        color: shadeRGBColor(color, shade)
    };
};

function onEachFeatureF(feature, layer) {
    console.log("oneach", feature, layer);
}

var recencyTileOptions = {
    rendererFactory: L.canvas.tile,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://www.mapbox.com/about/maps/">MapBox</a>',
    vectorTileLayerStyles: {

        'catTrack': function(properties, zoom) {


            var color2 = "rgb(241, 66, 244)"; // purple
            if (properties.Name === "Big Papa" || properties.Name === "ia") color2 = "rgb(200,0,0)"; //red";
            if (properties.Name === "RyePhone" || properties.Name === "jl") color2 = "rgb(0,0,200)"; //blue";
            if (properties.Name === "Big Mamma") color2 = "rgb(0, 200, 0)"; //green";
            if (properties.Name === "Kayleigh's iPhone") color2 = "rgb(200, 200, 0)"; //yellow


            var maxNormalPossibleSpeed = 15; // m/s, no rockets allowed

            return {
                stroke: false,
                fill: true,
                fillColor: recencyScale(properties, color2).color,
                fillOpacity: recencyScale(properties, color2).opacity,
                radius: recencyScale(properties, color2).radius,
                type: "Point"
            };
        }
    },
    interactive: true, // Make sure that this VectorGrid fires mouse/pointer events
    getFeatureId: function(f) {
        return f.properties.name;
    },
    onEachFeature: onEachFeatureF
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

var pbfLayer;

var drawLayer = function drawLayer (opts) {
    if (typeof pbfLayer !== "undefined") {
        map.removeLayer(pbfLayer);
    }

    pbfLayer = L.vectorGrid.protobuf(url, opts).addTo(map) // It would be nice if this could handle the zipper data instead of unxip on sever
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
            });
            L.DomEvent.stop(e);
        });
};
drawLayer(speedTileOptions);


document.getElementById("gostl").onclick = function() {
    map.setView([38.627, -90.1994], 12);
};
document.getElementById("gober").onclick = function() {
    map.setView([52.484777, 13.445776], 12);
};
document.getElementById("gowww").onclick = function() {
    map.setView([43.582793, -45.353025], 3);
};
document.getElementById("time-layer").onclick = function() {
    drawLayer(recencyTileOptions);
};
document.getElementById("speed-layer").onclick = function() {
    drawLayer(speedTileOptions);
};


// map.on('move', function() {
    // Construct an empty list to fill with onscreen markers.
    // var inBounds = [],
    //     // Get the map bounds - the top-left and bottom-right locations.
    //     bounds = map.getBounds();
    // // For each marker, consider whether it is currently visible by comparing
    // // with the current map bounds.
    // pbfLayer.eachLayer(function(marker) {
    //     if (bounds.contains(marker.getLatLng())) {
    //         // inBounds.push(marker.options.title);
    //         inBounds.push(marker.properties.Speed);
    //     }
    // });
    // // Display a list of markers.
    // document.getElementById('coordinates').innerHTML = inBounds.join('\n');
// });

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
