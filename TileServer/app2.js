// color defaults
var colors = {
    "Big Papa": "rgb(200,0,0)",
    "Bigger Papa": "rgb(200,0,0)",
    "RyePhone": "rgb(0,0,200)",
    "jl": "rgb(0,0,200)",
    "Big Mamma": "rgb(0,200,0)",
    "Kayleigh's iPhone": "rgb(200,200,0)"
};

var url = 'http://punktlich.rotblauer.com:8081/tiles/{z}/{x}/{y}';
url = 'http://localhost:8080/tiles/{z}/{x}/{y}';

var map = L.map('map', {
    maxZoom: 20,
    noWrap: true
}).setView([38.6270, -90.1994], 12);


// http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
function shadeRGBColor(color, percent) {
    var f = color.split(","),
        t = percent < 0 ? 0 : 255,
        p = percent < 0 ? percent * -1 : percent,
        R = parseInt(f[0].slice(4)),
        G = parseInt(f[1]),
        B = parseInt(f[2]);
    return "rgb(" + (Math.round((t - R) * p) + R) + "," + (Math.round((t - G) * p) + G) + "," + (Math.round((t - B) * p) + B) + ")";
}

function densityColor(density){
    var r = Math.floor(density*2),
        g = Math.floor(255-density),
        b = 0;
    return  "rgb(" + r + "," + g + "," + b + ")";
}

function radiusFromSpeed(speed) {
    if (typeof(speed) === "undefined") {
        return 3;
    }
    if (speed < 0) {
        speed = 0;
    }
    return Math.abs(3 - (Math.log(speed + 0.01) / 2));
}

count = 0;

function onEachFeature(feature) {
    console.log("counting", count);
    count++;
}

var speedTileOptions = {
    rendererFactory: L.canvas.tile,
    // attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://www.mapbox.com/about/maps/">MapBox</a>',
    vectorTileLayerStyles: {

        'catTrack': function(properties, zoom) {

            var color2 = colors[properties.Name] || "rgb(241,66,244)";

            var maxNormalPossibleSpeed = 15; // m/s, no rockets allowed
            return {
                stroke: false,
                fill: true,
                fillColor: shadeRGBColor(color2, ((properties.Speed / maxNormalPossibleSpeed) % 1.0) / 2),
                fillOpacity: 0.10,
                radius: radiusFromSpeed(properties.Speed),
                type: "Point"
            };
        }
    },
    interactive: true, // Make sure that this VectorGrid fires mouse/pointer events
    getFeatureId: function(f) {
        return f.properties.name;
    },
    onEachFeature: onEachFeature
};


var densityTileOptions = {
    rendererFactory: L.canvas.tile,
    vectorTileLayerStyles: {

        'catTrack': function(properties, zoom) {

            var color2 = colors[properties.Name] || "rgb(241,66,244)";
            return {
                stroke: false,
                fill: true,
                fillColor: densityColor(properties.tippecanoe_feature_density),
                fillOpacity: 0.10 ,
                    radius: 2,
                    type: "Point"
            };
        }
    },
    interactive: true, // Make sure that this VectorGrid fires mouse/pointer events
    getFeatureId: function(f) {
        return f.properties.name;
    },
    onEachFeature: onEachFeature
};


var now = new Date().getTime();
var oldest = new Date("2010-05-04T09:15:12Z").getTime();

var recencyTileOptions = {
    rendererFactory: L.canvas.tile,
    vectorTileLayerStyles: {

        'catTrack': function(properties, zoom) {

            var color2 = colors[properties.Name] || "rgb(241,66,244)";
            var time = new Date(properties.Time).getTime();

            return {
                stroke: false,
                fill: true,
                fillColor: d3.scaleLog().base(2)
                    .domain([oldest, now])
                    .range(["white", color2])(time),
                fillOpacity: d3.scaleLinear()
                    .domain([oldest, now])
                    .range([0, 1])(time),
                radius: 2,
                // radius: d3.scaleLog()
                //     .domain([oldest, now])
                //     .range([20, 1])(time),
                type: "Point"
            };
        }
    },
    interactive: true, // Make sure that this VectorGrid fires mouse/pointer events
    getFeatureId: function(f) {
        return f.properties.name + f.properties.Time;
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

var pbfLayer;
var drawnFeatures = [];

var drawLayer = function drawLayer(opts) {
    if (typeof pbfLayer !== "undefined") {
        map.removeLayer(pbfLayer);
    }

    var v = L.vectorGrid;
    pbfLayer = v.protobuf(url, opts).addTo(map) // It would be nice if this could handle the zipper data instead of unxip on sever
        .on('click', function(e) { // The .on method attaches an event handler
            L.popup()
                .setContent((e.layer.properties.Name || e.layer.properties.Type) +
                    "<br/> " +
                    "Speed: " + e.layer.properties.Speed + "m/s" + "<br/>" +
                    // "Heading: " + e.layer.properties.Heading + "deg" + "<br/>" +
                    "Elevation: " + e.layer.properties.Elevation + "m " + "<br/>" +
                    // "Accuracy: +/-" + e.layer.properties.Accuracy + "m" + "<br/>" +
                    "tfd: " + e.layer.properties.tippecanoe_feature_density + "<br />" +
                    e.layer.properties.Time
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
        })
        .on('load', function (e) {
            console.log('load', e);
        });
    document.getElementById("feature-count").innerHTML = "count: " + count;
};
drawLayer(speedTileOptions);

function collectFeatureProperties(tile) {
    // console.log("countertile --> ", tile);
    for (var t in tile) {
        if (tile.hasOwnProperty(t)) {
            // console.log("tile", tile);
            // var dls = tile._drawnLayers;
            // drawnFeatures = drawnFeatures.concat(_.keys(dls));
            var dls = tile._features;
            for (var d in dls) {
                if (dls.hasOwnProperty(d)) {
                    var dd = dls[d];
                    // drawnFeatures.push(dd); //_drawnLayers
                    drawnFeatures.push(dd.feature.properties); // _features

                    // var p = dd.properties;
                    // drawnFeatures.push(p);
                }
            }
        }
    }
}

document.getElementById("gostl").onclick = function() {
    map.setView([38.627, -90.1994], 12);
};
document.getElementById("gober").onclick = function() {
    console.log("going ber");
    map.setView([52.484777, 13.445776], 12);
};
document.getElementById("gohak").onclick = function() {
    console.log("going hak");
    map.setView([41.766667, 140.733333], 12);
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
document.getElementById("density-layer").onclick = function() {
    drawLayer(densityTileOptions);
};
