var earliestTrack = null;

// color defaults
var color_ia = "rgb(255,0,0)"; //"rgb(254,65,26)"; // "rgb(235,41,0)";
var color_jl = "rgb(0,0,255)"; // "rgb(0,162,235)";
var color_jl_meta = "rgb(70, 97, 152)";
var color_ia_meta = "#c42c21";
var colors = {
    "Big Papa": color_ia,
    "Bigger Papa": color_ia,
    "P2": color_ia,
    "ubp52": color_ia,
    "iha": color_ia,

    "RyePhone": color_jl,
    "Rye8": color_jl,
    "jl": color_jl,
    "jal": color_jl,

    "Big Mamma": "rgb(176,16,221)",
    "jra": "rgb(176,16,221)",

    "Kayleigh's iPhone": "rgb(200,200,0)",
    "kd": "rgb(200,200,0)",

    // matt
    "Twenty7": "rgb(20, 83, 94)", //darkbluegrey ish

    // chris
    "iPhone": "rgb(27,142,29)", // greenish
    "Chishiki": "rgb(27,142,29)",

    "jlc": "rgb(255, 128, 51)", //orangish

    "kek": "rgb( 0, 222, 20)", //brightgreen ish

    "rja": "rgb( 141, 0, 222 )",

    "coley": "rgb( 0, 176, 35 )", //dark green ish

    "pancho": "rgb(51, 153, 255)"
};

var dev = false;
// var dev = true;
// var vv = "v1";
var vv = "v2";

var tileHost = "http://punktlich.rotblauer.com:8081";
var trackHost = "http://track.areteh.co:3001";

if (vv == "v2") {
    tileHost = "http://catonmap.info:8080";
    trackHost = "http://catonmap.info:3001";
}
if (dev) {
    tileHost = "http://localhost:8081";
    trackHost = "http://localhost:3001";
}

var lastKnownJSONurl = trackHost + '/lastknown';
var metadataURL = trackHost + '/metadata';

// var url = 'http://punktlich.rotblauer.com:8081/master/{z}/{x}/{y}';
// var pbfurlmaster = 'http://punktlich.rotblauer.com:8081/anything/{z}/{x}/{y}';
// var url = 'http://localhost:8080/master/{z}/{x}/{y}';
// var pbfurlmaster = 'http://catonmap.info:8080/master/{z}/{x}/{y}'; // note that 'tiles' element of uri here can be any value

var defaultCenter = [38.6270, -90.1994];
var defaultZoom = 5;
var didLogOnce = false;

var pbfurlmaster = tileHost + '/master/{z}/{x}/{y}'; // note that 'tiles' element of uri here can be any value
var pbfurldevop = tileHost + '/devop/{z}/{x}/{y}'; // note that 'tiles' element of uri here can be any value
var pbfurledge = tileHost + '/edge/{z}/{x}/{y}'; // note that 'tiles' element of uri here can be any value
var pbfurlplaces = tileHost + '/places/{z}/{x}/{y}'; // note that 'tiles' element of uri here can be any value

var globalSinceFloor = ""; // actually will be an integer, but will just use +"" to cast that

var visits = [];

function getBrowsePosition() {
    var got = localStorage.getItem("browsePosition");
    // console.log("got browse local", got);
    if (got === null) {
        return got;
    }
    if (got.length > 1) {
        return got;
    }
    return null;
}
// TODO: I might get called more than necessary.... debounce? refactor?
function setBrowsePosition(s) {
    // console.log("settingbrowse", s);
    localStorage.setItem("browsePosition", s);
}

var drawnLayer = "recent";

var pbfLayer;
var pbfDevopLayer;
var pbfEdgeLayer;
var pbfPlacesLayer;

var drawnFeatures = [];
var map;
var current_tile_layer;
var mb_tile_outdoors_url = "https://api.mapbox.com/styles/v1/rotblauer/cjgejdj91001c2snpjtgmt7gj/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoicm90YmxhdWVyIiwiYSI6ImNpeTdidjZxajAwMzEycW1waGdrNmh3NmsifQ.OpXHPqEHK2sTbQ4-pmhAMQ";
var mb_tile_light1_url = "https://api.mapbox.com/styles/v1/rotblauer/ciy7ijqu3001a2rocq88pi8s4/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoicm90YmxhdWVyIiwiYSI6ImNpeTdidjZxajAwMzEycW1waGdrNmh3NmsifQ.OpXHPqEHK2sTbQ4-pmhAMQ";
var mb_tile_sat_url = "https://api.mapbox.com/styles/v1/rotblauer/cjgel0gt300072rmc2s34f2ky/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoicm90YmxhdWVyIiwiYSI6ImNpeTdidjZxajAwMzEycW1waGdrNmh3NmsifQ.OpXHPqEHK2sTbQ4-pmhAMQ";
var mb_tile_dark_url = "https://api.mapbox.com/styles/v1/rotblauer/cjnlrb8hq0jgh2rozuxxzopgx/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoicm90YmxhdWVyIiwiYSI6ImNpeTdidjZxajAwMzEycW1waGdrNmh3NmsifQ.OpXHPqEHK2sTbQ4-pmhAMQ";
var mb_tile_light1 = L.tileLayer(mb_tile_light1_url, {
    maxZoom: 19
});
var mb_tile_outdoors = L.tileLayer(mb_tile_outdoors_url, {
    maxZoom: 19
});
var mb_tile_sat = L.tileLayer(mb_tile_sat_url, {
    maxZoom: 19
});
var mb_tile_dark = L.tileLayer(mb_tile_dark_url, {
    maxZoom: 19
});

function getCurrentTileLayerName() {
    if (current_tile_layer !== null) {
        if (current_tile_layer === mb_tile_light1) {
            return "tile-light";
        } else if (current_tile_layer === mb_tile_outdoors) {
            return "tile-outdoors";
        } else if (current_tile_layer === mb_tile_sat) {
            return "tile-sat";
        } else if (current_tile_layer === mb_tile_dark) {
            return "tile-dark";
        }
    }
    return ""
}

function buildViewUrl() {
    var latlng = map.getCenter();
    var lat = latlng.lat;
    var lng = latlng.lng;
    var z = map.getZoom();
    var wl = window.location.origin;
    var text = wl + "?z=" + z +
        "&y=" + lng +
        "&x=" + lat +
        "&l=" + drawnLayer +
        "&t=" + getCurrentTileLayerName() +
        "&s=" + globalSinceFloor;
    return text;
}

function handleSinceFloor(v) {
    globalSinceFloor = v;
}

function putViewToUrl() {
    var t = buildViewUrl();
    setBrowsePosition(t);
    // document.getElementById("url-location").innerHTML = t;
    $("#url-location").attr("href", t);
    if ($("#map-layer-select").val() === "tile-dark") {
        $("#metadata-holder").css("background-color", "black");
        $("#metadata").css("color", "white");
        $("body").css("background-color", "black");
    } else {
        $("#metadata-holder").css("background-color", "white");
        $("#metadata").css("color", "black");
        $("body").css("background-color", "white");
    }
}

map = L.map('map', {
    maxZoom: 20,
    noWrap: true
    // preferCanvas: true
});

map.on("moveend", function() {
    didLogOnce = false;
    putViewToUrl();
    // $("#url-moved").css("color", "rgb(5, 255, 170)");
    // $("#url-moved").fadeOut(100).fadeIn(100); // .fadeOut(100).fadeIn(100);
});

map.on("load", function() {
    putViewToUrl();
    $("#url-moved").css("color", "white");
});

map.on("click", clearHighlight);
// map.on("load", putViewToUrl);
// Drawing Helpers
// ********************************************************************************************************************
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

function radiusFromSpeed(speed, zoom) {
    if (typeof(speed) === "undefined") {
        return 2;
    }
    if (speed < 0) {
        speed = 0;
    }
    var x = Math.abs(2 - (Math.log(speed + 0.01) / 2));
    if (zoom <= 12) {
        x++;
    }
    return x;
}

function onEachFeature(feature) {}


function setMapTileLayer(tile_layer) {
    if (pbfLayer !== null && typeof pbfLayer !== "undefined") {
        map.removeLayer(pbfLayer);
    }
    if (pbfDevopLayer !== null && typeof pbfDevopLayer !== "undefined") {
        map.removeLayer(pbfDevopLayer);
    }
    if (pbfEdgeLayer !== null && typeof pbfEdgeLayer !== "undefined") {
        map.removeLayer(pbfEdgeLayer);
    }
    if (pbfPlacesLayer !== null && typeof pbfPlacesLayer !== "undefined") {
        map.removeLayer(pbfPlacesLayer);
    }

    if (current_tile_layer !== null && typeof current_tile_layer !== "undefined") {
        console.log("removing current tile layer");
        map.removeLayer(current_tile_layer);
    }
    current_tile_layer = tile_layer;
    map.addLayer(current_tile_layer);

    if (pbfLayer !== null && typeof pbfLayer !== "undefined") {
        map.addLayer(pbfLayer);
    }
    if (pbfDevopLayer !== null && typeof pbfDevopLayer !== "undefined") {
        map.addLayer(pbfDevopLayer);
    }
    if (pbfEdgeLayer !== null && typeof pbfEdgeLayer !== "undefined") {
        map.addLayer(pbfEdgeLayer);
    }
    if (pbfPlacesLayer !== null && typeof pbfPlacesLayer !== "undefined") {
        map.addLayer(pbfPlacesLayer);
    }

}

function delegateTileLayer(name) {
    // console.log("clicked tile setter", name);
    if (name === "tile-light" && current_tile_layer !== mb_tile_light1) {
        setMapTileLayer(mb_tile_light1);
    } else if (name === "tile-outdoors" && current_tile_layer !== mb_tile_outdoors) {
        setMapTileLayer(mb_tile_outdoors);
    } else if (name === "tile-sat" && current_tile_layer !== mb_tile_sat) {
        setMapTileLayer(mb_tile_sat);
    }
    if (name === "tile-dark" && current_tile_layer !== mb_tile_dark) {
        setMapTileLayer(mb_tile_dark);
        $("#metadata-holder").css("background-color", "black");
        $("#metadata").css("color", "white");
        $("body").css("background-color", "black");

    } else {
        $("#metadata-holder").css("background-color", "white");
        $("#metadata").css("color", "black");
        $("body").css("background-color", "white");
    }

    if ($("#map-layer-select").val() !== name) {
        $("#map-layer-select").val(name);
    }
}

$(".tile-button").on("click", function(e) {
    var id = $(this).attr("id");
    delegateTileLayer(id);
    putViewToUrl(buildViewUrl());
});

var highlight;
var clearHighlight = function() {
    if (highlight) {
        pbfLayer.resetFeatureStyle(highlight);
    }
    highlight = null;
};

var speedFn = function(properties, zoom) {
    if (globalSinceFloor !== "") {

        if (new Date().getTime() - new Date(properties.Time).getTime() > +globalSinceFloor * 24 * 60 * 60 * 1000) {
            return {};
        }
    }

    var color2 = colors[properties.Name] || "rgb(241,66,244)";

    var maxNormalPossibleSpeed = 15; // m/s, no rockets allowed
    return {
        stroke: false,
        fill: true,
        fillColor: shadeRGBColor(color2, ((properties.Speed / maxNormalPossibleSpeed) % 1.0) / 2),
        fillOpacity: 0.1,
        radius: radiusFromSpeed(properties.Speed, zoom),
        type: "Point"
    };
};

var speedTileOptions = {
    rendererFactory: L.canvas.tile,
    // attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://www.mapbox.com/about/maps/">MapBox</a>',
    vectorTileLayerStyles: {
        'catTrack': speedFn,
        'catTrackEdge': speedFn
    },
    // interactive: true, // Make sure that this VectorGrid fires mouse/pointer events
    getFeatureId: function(f) {
        return f.properties.name;
    },
    onEachFeature: onEachFeature
};

// Elevation: -0.00240357150323689
// Name: "Bigger Papa"
// Speed: 0.6299999952316284
// Time: "2018-02-09T13:37:54.947Z"
// clustered: true
// point_count: 3
// sqrt_point_count: 1.73
// tippecanoe_feature_density: 8
//
function densityColor(density) {
    var r = Math.floor(density * 2),
        g = Math.floor(255 - density),
        b = 0;
    return "rgb(" + r + "," + g + "," + b + ")";
}
// https://stackoverflow.com/questions/340209/generate-colors-between-red-and-green-for-a-power-meter/340214#340214
function percentToRGB(percent) {
    if (percent >= 100) {
        percent = 99
    }

    var r, g, b;

    if (percent < 50) {
        // green to yellow
        r = Math.floor(255 * (percent / 50));
        g = 255;

    } else {
        // yellow to red
        r = 255;
        g = Math.floor(255 * ((50 - percent % 50) / 50));
    }
    b = 0;

    return "rgb(" + r + "," + g + "," + b + ")";
}


// -ag or --calculate-feature-density: Add a new attribute, tippecanoe_feature_density, to each feature, to record how densely features are spaced in that area of the tile. You can use this attribute in the style to produce a glowing effect where points are densely packed. It can range from 0 in the sparsest areas to 255 in the densest.
var maxDensity = 255;
var maxRadius = 10;

var zRangeMin = 3;
var zRangeMax = 20;
var zRangeDiff = zRangeMax - zRangeMin;
// At lower (farther out) zooms, we should "desensitize" scaling since most points will be "clustered" in higher numbers,
// whereas at higher (closer) zooms, we should adjust tolerance to be more centered around lower feature_density values.
function getRelDensity(zoom, n) {
    var stepSize = maxDensity / zRangeDiff; // 255 / 17 = 15
    // var zAdjust = zoom-1-zRangeMin; // zoom = 14-1-3 = 10, 20-1-3 = 16, 3-1-3 = -1
    // var bound = maxDensity - stepSize*zoom;
    // // if zoom == 3  --> 255-15*2 as lower bound, find ratio of feature_density between 221 <-> 255; eg. 238 = 50%
    // max(255)-stepN(34) = lower(221)
    // max(255)-lower(221) = mldiff(34)
    // eg(238)-lower(221)= rel(17)
    // rel(17)/mldiff(34) == .50
    //
    // //                   255 - (stepSize * zoom-1)
    // // if zoom == 19 --> 255-(19-3-1);
    // if (zoom === 3) {
    //     return n -
    // }

    var stepN = zoom - 1;
    // if (zoom === 3) {
    //     stepN = stepN + 1; // 2 * stepSize = 30, 255 - 30 = 225,
    // } else if (zoom === 4) {
    //     stepN = stepN + 2;
    // } else if (zoom === 5) {
    //     stepN = stepN + 3; // 4 * 15 = 60, 255 - 60 = 195,
    // }
    var lower = maxDensity - (stepN * stepSize);
    if (n < lower) {
        n = lower;
    }
    var mldiff = maxDensity - lower;
    var rel = n - lower;
    var relDensity = rel / mldiff;
    return relDensity;
}

var placePinIcon = L.icon({
    iconUrl: "/map-icon-red.png",
    iconSize: [32,32],
    iconAnchor: [16, 32],
    popupAnchor: [16, 16]
});

var arrivedPinIcon = L.icon({
    // iconUrl: "/green-map-pin.png",
    // iconUrl: "/green-pin-icon2.png",
    iconUrl: "/green-pin-icon3.png",
    // iconSize: [25,36],
    iconSize: [32,32],
    iconAnchor: [16,32],
    popupAnchor: [16,16]
});

var densityFn = function(layer, properties, zoom) {
    if (globalSinceFloor !== "") {
        if (new Date().getTime() - new Date(properties.Time).getTime() > +globalSinceFloor * 24 * 60 * 60 * 1000) {
            return {};
        }
        if (new Date().getTime() - new Date(properties["ArrivalTime"]).getTime() > +globalSinceFloor * 24 * 60 * 60 * 1000) {
            return {};
        }
    }

    if (properties.hasOwnProperty("Notes") && !didLogOnce) {
        // alert("there are notesss!!!");
        didLogOnce = true;
    }

    // anything above about zoom 14-15 will not be clustered!...
    if (!properties.clustered && layer !== "catTrackPlace") {
        return {
            stroke: false,
            fill: true,
            fillColor: "#FF10DE", // colors[properties.Name], // "#00A2EB", "#EB2900"
            weight: 0,
            radius: 1,
            opacity: 0.05
        }
    }

    // var relAbsoluteDensity = (properties.tippecanoe_feature_density/maxDensity); // maxDensity is max
    var relAbsoluteDensity = (properties.tippecanoe_feature_density / (maxDensity * (zRangeMin / zoom))); // scale max density by zoom linearly
    var relAbsoluteDensityPercent = Math.floor(relAbsoluteDensity * 100);

    // var relD = getRelDensity(zoom, properties.tippecanoe_feature_density);
    // var relDPercent = Math.floor(relD*100);

    var out = {
        stroke: false,
        fill: true,
        fillColor: function() {
            var factor = properties.sqrt_point_count;
            factor = factor * (zoom / zRangeMax) * 2;
            if (zoom <= 8 && zoom > 5) {
                factor = factor * (zoom / zRangeDiff);
            }
            if (zoom <= 5) {
                factor = properties.point_count * (zoom / zRangeDiff); // / (zoom/(zoom+1-zRangeMin));
            }
            var n = percentToRGB(relAbsoluteDensityPercent * factor); // densityColor(properties.tippecanoe_feature_density),
            return n;
        }(),
        // fillColor: percentToRGB(relDPercent), // densityColor(properties.tippecanoe_feature_density),
        // fillOpacity: 0.05, // (properties.points_count*0.55)/100, // 0.1, //relAbsoluteDensity//0.10 ,
        fillOpacity: 0.05 * (zoom / zRangeDiff), // (properties.points_count*0.55)/100, // 0.1, //relAbsoluteDensity//0.10 ,
        radius: function() {
            var n = 0;
            if (zoom > 14) {
                n = Math.floor(relAbsoluteDensity * (properties.point_count) * maxRadius);
            } else {
                n = Math.floor(relAbsoluteDensity * (properties.point_count) * maxRadius);
            }


            if (n > maxRadius) {
                n = maxRadius;
                if (zoom < 5) {
                    n = zRangeMin / 4 * n;
                }
            } else if (n < 1) {
                n = Math.floor(relAbsoluteDensity * (properties.point_count + (zoom / zRangeDiff)) * maxRadius);
            }
            return n;
        }(), // ~max 100 from maxDensity actual max // +1 ??
        // radius: Math.floor(relDPercent*maxRadius), // ~max 100 from maxDensity actual max // +1 ??
        type: "Point"
    };

    if (!didLogOnce) {
        // console.log("example", "props", properties, "zoom");
        console.log("logOne", "zoom", zoom, "properties", properties, "out", out);
        didLogOnce = true;
    }

    if (layer === "catTrackPlace") {
        console.log("propes", properties);
        var year = new Date(properties["DepartureTime"]).getFullYear();
        if (year >= 4000) {
            return {};
            // out.icon = arrivedPinIcon;
        }
        console.log("year", year);
        out.fill= false;
        out.type = "Icon";
        out.icon = placePinIcon;
    }
    return out;
};

var densityTileOptions = {
    rendererFactory: L.canvas.tile,
    vectorTileLayerStyles: {
        'catTrack': function(props, zoom) {
            return densityFn("catTrack", props, zoom);
        },
        'catTrackEdge': function(props, zoom) {
            return densityFn("catTrackEdge", props, zoom);
        },
        'catTrackPlace': function(props, zoom) {
            return densityFn("catTrackPlace", props, zoom);
        },
    },
    interactive: true, // Make sure that this VectorGrid fires mouse/pointer events
    getFeatureId: function(f) {
        return f.properties.name;
    },
    onEachFeature: onEachFeature
};


var now = new Date().getTime();
var oldest = new Date("2012-03-24T15:01:44Z").getTime();

var oneDay = 1000 * 60 * 60 * 24;

// var maxDateDiff = now - oneWeek; // diff in millis

var recencyScale = function(props, color) {
    var dateString = props.Time;
    var density = props.tippecanoe_feature_density;
    if (density === 0) {
        density = 1;
    }
    var then = new Date(dateString).getTime();
    var diff = now - then;
    //Fit[{1,3,7,14,30,150,2000},{0.99,0.8,0.6,0.3,0.15,0.09,0},x]

    // opacity
    // day, 3 days, week, fortnight, month, sixmonth, year
    // 1,   0.8     0.6   0.4        0.2    0.1       0.05
    // radius
    // day, 3 days, week, fortnight, month, sixmonth, year
    // 2    3       4      5         6      7         9
    var opacity = 0.05;
    const radius = 2;
    var shade = 0.8;

    if (diff <= oneDay) {
        opacity = 0.9;
        shade = -0.5;
    } else if (diff <= oneDay * 3) {
        opacity = 0.8;
        shade = -0.2;
    } else if (diff <= oneDay * 7) {
        opacity = 0.6;
        shade = -0.1;
    } else if (diff <= oneDay * 14) {
        opacity = 0.3;
        shade = 0.2;
    } else if (diff <= oneDay * 30) {
        opacity = 0.15;
        shade = 0.5;
    } else if (diff <= oneDay * 150) {
        opacity = 0.09;
        shade = 0.7;
    }

    return {
        opacity: opacity, //opacity / 3,
        radius: radius,
        color: shadeRGBColor(color, shade)
    };
};

function invert(rgb) {
    rgb = Array.prototype.join.call(arguments).match(/(-?[0-9\.]+)/g);
    for (var i = 0; i < rgb.length; i++) {
        rgb[i] = (i === 3 ? 1 : 255) - rgb[i];
    }
    return rgb;
}

var n = 0;
var recencyFn = function(properties, zoom, layer) {
    if (globalSinceFloor !== "") {
        // console.log("recent globalSinceFloor", globalSinceFloor);
        if (new Date().getTime() - new Date(properties.Time).getTime() > +globalSinceFloor * 24 * 60 * 60 * 1000) {
            return {};
        }
        if (new Date().getTime() - new Date(properties["ArrivalTime"]).getTime() > +globalSinceFloor * 24 * 60 * 60 * 1000) {
            return {};
        }
    }

    // if (n === 0) {
    //     console.log("PROPERTIES", properties);
    //     // n++;


    //     var notes = JSON.parse(properties["notes"]);
    //     if (notes.hasOwnProperty("visit")) {
    //         console.log("notes w/ VV", notes);
    //         n++
    //     } else {
    //         // console.log("nonotes", notes);
    //     }
    //     // n++;
    // }

    // if (earliestTrack == null) {
    //     earliestTrack = properties["Time"];
    // } else if (moment(properties["Time"]).isBefore(earliestTrack)) {
    //     earliestTrack = properties["Time"];
    //     console.log("earliesttrack", earliestTrack);
    // #=> earliesttrack 2012-03-24T15:01:44Z
    // }

    if (properties.hasOwnProperty("Notes") && !didLogOnce) {
        // alert("there are notesss!!!");
        didLogOnce = true;
    }
    if (trackExampler === 0) {
        console.log("props", properties);
    }
    trackExampler++;

    var color2 = colors[properties.Name] || "rgb(241,66,244)";
    var time = new Date(properties.Time).getTime();

    var out = {
        stroke: false,
        fill: true,
        fillColor: recencyScale(properties, color2).color,
        fillOpacity: recencyScale(properties, color2).opacity,
        radius: recencyScale(properties, color2).radius,
        type: "Point"
    };

    // if (layer === "catTrackEdge") {
    //     out.fillColor = "dodgerblue";
    // }

    if (layer === "catTrackPlace") {

        var year = new Date(properties["DepartureTime"]).getFullYear();
        if (year >= 4000) {
            return {};
            // out.icon = arrivedPinIcon;
        }

        var c2 = color2;
        var placecolor = c2;
        var placecolori = invert(c2);
        if (placecolori.length === 3) {
            placecolor = "rgb(" + placecolori[0] + "," + placecolori[1] + "," + placecolori[2] + ")";
        } else if (placecolori.length === 4) {
            placecolor = "rgba(" + placecolori[0] + "," + placecolori[1] + "," + placecolori[2] + "," + placecolori[3] + ")";
        }
        // out.fillColor = placecolor,
        // out.stroke = "cornflowerblue",
        // asdf asdfasdf

        out.stroke = true;
        // NOOP WTF
        // out.stroke = c2;
        // out.strokeColor = placecolor;

        out.fillColor = placecolor;
        // out.fillColor = placecolor;
        // out.fillColor = "gold";

        // out.fillOpacity = 0.33;
        out.fillOpacity = 1;
        out.radius= 10;
        out.type= "Point";
        // console.log("place", properties);
        // // alert("got place", layer, properties);

    }

    return out;
};

var trackExampler = 0;
var recencyTileOptions = {
    rendererFactory: L.canvas.tile,
    vectorTileLayerStyles: {
        'catTrack': function(props, z) {
            return recencyFn(props, z, "catTrack");
        },
        'catTrackEdge': function(props, z) {
            return recencyFn(props, z, "catTrackEdge");
        },
        'catTrackPlace': function(props, z) {
            return recencyFn(props, z, "catTrackPlace");
        }

    },
    interactive: true, // Make sure that this VectorGrid fires mouse/pointer events
    getFeatureId: function(f) {
        return f.properties.name + f.properties.Time;
    }
};

var activityColorLegend = {
    "": "lightgray",
    "Unknown": "lightgray",
    "Stationary": "blueviolet",
    "Walking": "dodgerblue",
    "Running": "lightgreen",
    "Bike": "gold",
    "Automotive": "orangered"
};

function activityFn(props, z, layer) {
    var c = activityColorLegend[props["Activity"]];
    if (c === "lightgray") {
        return {};
    }
    var out = {
        stroke: false,
        fill: true,
        fillColor: c || "lightgray",
        fillOpacity: c !== "lightgray" ? 0.9 : 0.1,
        radius: 2,
        type: "Point"
    };

    return out;
}

var activityTileOptions = {
    rendererFactory: L.canvas.tile,
    vectorTileLayerStyles: {
        'catTrack': function(props, z) {
            return activityFn(props, z, "catTrack");
        },
        'catTrackEdge': function(props, z) {
            return activityFn(props, z, "catTrackEdge");
        },
        'catTrackPlace': function(props, z) {
            return activityFn(props, z, "catTrackPlace");
        }
    },
    getFeatureId: function(f) {
        return f.properties.name + f.properties.Time;
    }
};

function tripLayerHandler(props, color) {
    return {
        opacity: recencyScale(props, color).color, //opacity / 3,
        radius: 1,
        color: color // shadeRGBColor(color, shade)
    };
}



var tripTileOptions = {
    rendererFactory: L.canvas.tile,
    vectorTileLayerStyles: {

        'catTrack': function(properties, zoom) {
            // if (!didLogOnce) {
            //     console.log("example", "props", properties, "zoom");
            //     didLogOnce = true;
            // }
            // hide if not on a trip
            // if (typeof properties.Notes === "undefined" || properties.Notes === null || properties.Notes === "") {
            if (!properties.hasOwnProperty("Notes")) {
                return {
                    stroke: false,
                    weight: 0,
                    fill: false,
                    radius: 0
                }
            }

            var color2 = colors[properties.Name] || "rgb(241,66,244)";
            var time = new Date(properties.Time).getTime();

            return {
                stroke: false,
                fill: true,
                fillColor: tripLayerHandler(properties, color2).color,
                fillOpacity: tripLayerHandler(properties, color2).opacity,
                radius: tripLayerHandler(properties, color2).radius,
                type: "Point"
            };
        }
    },
    interactive: true, // Make sure that this VectorGrid fires mouse/pointer events
    getFeatureId: function(f) {
        return f.properties.name + f.properties.Time;
    }
};

var drawLayer = function drawLayer(opts) {
    if (typeof pbfLayer !== "undefined") {
        map.removeLayer(pbfLayer);
    }
    if (typeof pbfEdgeLayer !== "undefined") {
        map.removeLayer(pbfEdgeLayer);
    }
    if (typeof pbfDevopLayer !== "undefined") {
        map.removeLayer(pbfDevopLayer);
    }
    if (typeof pbfPlacesLayer !== "undefined") {
        map.removeLayer(pbfPlacesLayer);
    }

    var v = L.vectorGrid;

    pbfLayer = v.protobuf(pbfurlmaster, opts);
    pbfLayer.addTo(map) // It would be nice if this could handle the zipper data instead of unxip on sever
        .on('load', function(e) {
            // console.log('load', e);
        });

    pbfDevopLayer = v.protobuf(pbfurldevop, opts);
    pbfDevopLayer.addTo(map).on('load', function(e) {
        // console.log('loaded pbfdevoplayer');
    });

    pbfEdgeLayer = v.protobuf(pbfurledge, opts);
    pbfEdgeLayer.addTo(map).on('load', function(e) {
        // console.log('loaded pbfedgelayer');
    });
    pbfPlacesLayer = v.protobuf(pbfurlplaces, opts);
    pbfPlacesLayer.addTo(map).on('load', function(e) {
        // console.log('loaded pbfedgelayer');
    }).on('click', function(e) {
        console.log("clicked", e);
        console.log("clicked elayprops", e.layer.properties);
        var props = e.layer.properties;
        // alert(props.Name + " visited " + props.PlaceIdentity + "\n" + "From " + props.ArrivalTime + " to " + props.DepartureTime);
        var start = moment(props.ArrivalTime);
        var end = moment(props.DepartureTime);

        var timeSpent = end.to(start, true);


        var str = props.Name + " visited " + props.PlaceIdentity + " for " + timeSpent +  ", from " + new Date(props.ArrivalTime).toLocaleString() + " to " + new Date( props.DepartureTime ).toLocaleString();

        if (end.year() >= 4000) {
            str = props.Name + " arrived at " + props.PlaceIdentity + " at " + new Date(props.ArrivalTime).toLocaleString();
        }

				L.popup()
					  .setContent(str)
        // 					.setContent(JSON.stringify(e.layer))
					  .setLatLng(e.latlng)
					  .openOn(map);
				clearHighlight();
				highlight = e.layer.properties.osm_id;
				// pbfPlacesLayer.setFeatureStyle(highlight, {
				// 	  weight: 2,
				// 	  color: 'red',
				// 	  opacity: 1,
				// 	  fillColor: 'red',
				// 	  fill: true,
				// 	  radius: 6,
				// 	  fillOpacity: 1
				// });
				L.DomEvent.stop(e);
    });

};

function delegateDrawLayer(name) {
    drawnLayer = name
    if (name === "speed") {
        drawLayer(speedTileOptions);
    } else if (name === "recent") {
        drawLayer(recencyTileOptions);
    } else if (name === "density") {
        drawLayer(densityTileOptions);
    } else if (name === "trip") {
        drawLayer(tripTileOptions);
    } else if (name === "activity") {
        drawLayer(activityTileOptions);
    }
    if ($("#points-layer-select").val() !== drawnLayer) {
        $("#points-layer-select").val(drawnLayer);
    }

    var alegend = $("#activity-layer-legend");
    if (name !== "activity") {
        alegend.hide();
        return;
    }
    alegend.show();
    if (alegend.children().length > 0) {
        return;
    }
    for (k in activityColorLegend) {
        var v = activityColorLegend[k];
        console.log("activeity", k,  v);
        var legendElement = $("<span></span>");
        legendElement.text(k);
        legendElement.css("color", v);
        legendElement.css("font-weight", "bold");
        legendElement.css("padding-left", "3px");
        legendElement.css("padding-right", "3px");
        if (v === "lightgray") {
            legendElement.css("text-decoration", "line-through");
        }
        alegend.append(legendElement);
    }

    // $("#activity-layer-legend")
}

function getQueryVariable(variable, url) {
    if (typeof url === "undefined" || url === null || window.location.href.indexOf("=") >= 0) {
        url = window.location.search;
    } else {
        i = url.indexOf("?")
        url = url.substring(i);
    }
    var query = decodeURIComponent(url.substring(1));
    // console.log("query/variable", query, variable);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return pair[1];
        }
    }
    return (false);
}

function putUrlToView(event) {
    console.log("putting view from url");
    // use default is no query in url
    var center = defaultCenter;
    var zoom = defaultZoom;
    var pos = getBrowsePosition();
    var z = getQueryVariable("z", pos);
    var y = getQueryVariable("y", pos);
    var x = getQueryVariable("x", pos);
    var layer = getQueryVariable("l", pos);
    var tile = getQueryVariable("t", pos);
    var since = getQueryVariable("s", pos);
    var user = getQueryVariable("u", pos);
    if (z) {
        zoom = +(z) // cast to float
    }
    if (y) {
        center[1] = +(y)
    }
    if (x) {
        center[0] = +(x)
    }

    if (since) {
        globalSinceFloor = "" + since;
        $("#sincefloor").val("" + since);
    } else {
        $("#sincefloor").val("");
    }

    console.log("putUrlToView", center, zoom);
    map.setView(center, zoom);
    if (tile && tile !== "") {
        delegateTileLayer(tile);
    } else {
        delegateTileLayer("tile-dark");
    }
    if (layer) {
        delegateDrawLayer(layer)
    } else {
        delegateDrawLayer(drawnLayer);
    }
    console.log("wl", window.location);
    if (window.location.host.includes("catonmap")) {
        document.title = "Cat On Map";
    } else if (window.location.host.includes("punktlich")) {
        document.title = "Punktlich";
    } else if (window.location.host.includes("localhost")) {
        document.title = "Development";
    } else {
        console.log("nope", window.location + "".indexOf("localhost"));
    }
    putViewToUrl();
}
putUrlToView();

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getmetadata() {
    $.ajax({
        type: 'GET',
        url: metadataURL,
        dataType: 'json',
        success: function(data) {
            console.log(data);
            // debug and notes
            // {"KeyN":3441161,"LastUpdatedAt":"2018-04-20T11:05:28.194001962-07:00","LastUpdatedBy":"Bigger Papa","LastUpdatedPointsN":84}
            // $("#metadata").text(JSON.stringify(data));

            var div = $("#metadata");
            div.text(numberWithCommas(data["KeyN"]) + " points added in the last " +
                moment(data["KeyNUpdated"]).fromNow(true).replace("a ", "").replace("an ", "") + "." + "\n" +
                "TileDB last updated " + moment(data["TileDBLastUpdated"]).fromNow() + ".");

            // replace all newlines with html linebreaks
            div.html(div.html().replace(/\n/g, '<br/>'));

            // set border on left to color of latest-known cat
            if (colors.hasOwnProperty(data["LastUpdatedBy"])) {
                $("#metadata-holder").css("border-left", "8px solid " + colors[data["LastUpdatedBy"]]);
            }
        }
    });


}

var catIcon = L.icon({
    iconUrl: 'cat-icon.png',
    // shadowUrl: 'leaf-shadow.png',

    iconSize: [32, 32], // size of the icon
    // shadowSize:   [50, 64], // size of the shadow
    iconAnchor: [16, 16], // point of the icon which will correspond to marker's location
    // shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [0, -8] // point from which the popup should open relative to the iconAnchor
});
var catIconSmall = L.icon({
    iconUrl: 'cat-icon.png',
    // shadowUrl: 'leaf-shadow.png',

    iconSize: [16, 16], // size of the icon
    // shadowSize:   [50, 64], // size of the shadow
    iconAnchor: [8, 8], // point of the icon which will correspond to marker's location
    // shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [0, -4] // point from which the popup should open relative to the iconAnchor
});
var onMapMarkers = [];

function getAndMakeButtonsForLastKnownCats() {
    // $("#metadata").hide();
    $.ajax({
        type: 'GET',
        url: lastKnownJSONurl,
        dataType: 'json',
        success: function(data) {
            // $("#metadata-holder").css("background-color", "black");
            console.log("data getandmakebuttonsforlastknowncats", data);
            $("#metadata").show();
            $("#lastknowns").html("");

            // in case any existing already, remove em
            for (var i = 0; i < onMapMarkers.length; i++) {
                var cat = onMapMarkers[i];
                // cat.setIcon(catIconSmall);
                // cat.setOpacity(1/i);
                map.removeLayer(cat);
            }
            onMapMarkers = [];

            var sortedByTime = [];
            $.each(data, function(key, val) {
                sortedByTime.push(val);
            });
            sortedByTime.sort((a, b) => (moment(a["time"]).isBefore(b["time"])) ? 1 : ((moment(b["time"]).isBefore(a["time"])) ? -1 : 0));
            // console.log("sortedByTime", sortedByTime);

            var collectedByUser = {};
            for (var i = 0; i < sortedByTime.length; i++) {
                var color = colors[sortedByTime[i]["name"]];
                if (!collectedByUser.hasOwnProperty(color)) {
                    collectedByUser[color] = [sortedByTime[i]];
                } else {
                    collectedByUser[color].push(sortedByTime[i]);
                }
            }
            // console.log("collectedByUser", collectedByUser);

            $.each(collectedByUser, function(key, val) {
                console.log("1key", key, "val", val);
                // ignore the old ones

                // override because we used colors as alias for identity, now we want names back to avoid refactoring
                var oVal = val;
                val = val[0];
                key = val["name"]; // key was color

                console.log("2key", key, "val", val);

                if (moment(val["time"]).add(3, 'days').isBefore(moment())) {
                    return;
                }

                // if (val.hasOwnProperty("notes") && val["notes"] !== "") {
                //     console.log(key, "steps", JSON.parse(val["notes"]));
                // }

                var n = val["name"];
                // if (oVal.length > 1) {
                //     n += "<sup>" + oVal.length + "</sup>";
                // }
                var button = $("<span id='" + key + "' class='lastknownlink' style=''> " + n + ", " + moment(val["time"]).fromNow() + "</span>");
                button.data("lat", val["lat"] + "");
                button.data("long", val["long"] + "");
                button.css("z-index", 10000);

                var c = "#21DBEB";
                if (colors.hasOwnProperty(val["name"])) {
                    c = colors[val["name"]];
                    button.css("background-color", c);
                    // c = shadeRGBColor(c, 0.5);
                    button.css("color", "white");
                }
                $("#lastknowns").append(button);
                $("#lastknowns").append($("<br>"));

                var l = L.marker([+val["lat"], +val["long"]], {
                    icon: catIcon
                });
                map.addLayer(l);
                onMapMarkers.push(l);

                // var mopts = {
                //     color: c,
                //     weight: 2,
                //     // fillColor: '#EB38D3',
                //     fillOpacity: 0,
                //     radius: 150
                // }

                // var circle = L.circle([+val["lat"], +val["long"]], mopts).addTo(map);
                // circle.bindPopup(JSON.stringify(val));

                $(document).on('click', '.lastknownlink', function(e) {
                    // console.log("$this", $(this));
                    var lat = $(this).data("lat");
                    var lng = $(this).data("long");
                    // console.log(lat, lng);
                    map.setView([+lat, +lng]);
                    // what you want to happen when mouseover and mouseout
                    // occurs on elements that match '.dosomething'
                });
            });
            getmetadata();
            setTimeout(getAndMakeButtonsForLastKnownCats, 1000 * 60); // re-call again in a minute
        },
        error: function(err) {
            console.error("err", err);
            $("#metadata").show();
            $("#metadata-holder").css("background-color", "rgb(249, 133, 0)");
            $("#metadata").text("DB locked; syncing to the tracks mapper master.");
            $("#lastknowns").html("");
            // setTimeout(function() {$("#metadata").hide();}, 1000 * 20);
            setTimeout(getAndMakeButtonsForLastKnownCats, 1000 * 120); // re-call again in two minutes
        }
    });
    // fuck this fucking JSONP json cross origin SHIT.
    // $.getJSON(lastKnownJSONurl + "?callback=?", function( res ) {
    //     // var string = JSON.stringify(res);
    //     // var data = JSON.parse(string);
    //     //
    //     var data = res;

    //     console.log(data["Bigger Papa"]);
    //     $.each( data, function( key, val ) {
    //         var i = $( "<li id='" + key + "' class='lastknownlink'> " + val["name"] + "</li>" );
    //         i.onclick = function() {
    //             map.setView([+val["lat"], +val["long"]], 13);
    //         };
    //         items.push(i);
    //       });
    // });
    // console.log("items", items);
    // have to set from document because thye're dynamically created eleements and SO says so: https://stackoverflow.com/questions/203198/event-binding-on-dynamically-created-elements

}
getAndMakeButtonsForLastKnownCats();


$("#sincefloor").change(function() {
    var v = $(this).val();
    handleSinceFloor(v);
    putViewToUrl();
    putUrlToView();
});


$("#goview").change(function() {
    var v = $(this).val();
    if (v === "world") {
        // map.flyTo is cooler, but might explode computers
        map.setView([42.94033923363183, -103.35937500000001], 3);
    } else if (v === "usa") {
        map.setView([37.73596920859053, -99.97558593750001], 5);
    } else if (v === "stlouis") {
        map.setView([38.60969439928821, -90.24324417114258], 13);
    } else if (v === "iceland") {
        map.setView([63.868504963579994, -19.572143554687504], 8);
    } else if (v === "hokkaido") {
        map.setView([42.77322729247907, 142.20153808593753], 8);
    }
});

$("#points-layer-select").on("change", function() {
    var v = $(this).val();
    delegateDrawLayer(v);
    // putViewToUrl(buildViewUrl());
    putViewToUrl(buildViewUrl());
    // putUrlToView();
});

$("#map-layer-select").on("change", function() {
    var v = $(this).val();
    // var id = $(this).attr("id");
    delegateTileLayer(v);
    putViewToUrl(buildViewUrl());
});

// document.getElementById("recent-layer").onclick = function() {
//     delegateDrawLayer("recent");
//     putViewToUrl(buildViewUrl());
// };
// document.getElementById("speed-layer").onclick = function() {
//     delegateDrawLayer("speed");
//     putViewToUrl(buildViewUrl());
// };
// document.getElementById("density-layer").onclick = function() {
//     delegateDrawLayer("density");
//     putViewToUrl(buildViewUrl());
// };
// document.getElementById("trip-layer").onclick = function() {
//     delegateDrawLayer("trip");
//     putViewToUrl(buildViewUrl());
// };
document.getElementById("url-location").onclick = function() {
    window.location.href = encodeURI(buildViewUrl());
}

$("#metadata-holder").css("top", $("#map")[0].getBoundingClientRect().top);
// $("#lastknowns-div").css("bottom", $("#map")[0].getBoundingClientRect().bottom);

// {
//   "Big Mamma": {
//     "uuid": "71ACB5F0-FE89-405A-8CDB-16DB56ED104E",
//     "id": 0,
//     "name": "Big Mamma",
//     "lat": 38.60419845581055,
//     "long": -90.33721160888672,
//     "accuracy": 10,
//     "elevation": 150.54522705078125,
//     "speed": 0,
//     "tilt": 0,
//     "heading": -1,
//     "heartrate": 0,
//     "elevation": 169.50436401367188,
//     "speed": 0,
//     "tilt": 0,
//     "heading": -1,
//     "heartrate": 0,
//     "time": "2018-10-26T07:26:46.995Z",
//     "notes": "{\"floorsAscended\":0,\"customNote\":\"\",\"currentTripStart\":\"2018-10-26T02:48:56.830Z\",\"floorsDescended\":0,\"averageActivePace\":0,\"numberOfSteps\":0,\"relativeAltitude\":27.577896118164062,\"currentCadence\":0,\"activity\":\"Stationary\",\"currentPace\":0,\"pressure\":98.920867919921875,\"distance\":0}"
//   },
//   "Chishiki": {
//     "uuid": "49E78967-1891-4364-8910-2DA90B063C0C",
//     "id": 0,
//     "name": "Chishiki",
//     "lat": 41.78996658325195,
//     "long": 140.75045776367188,
//     "accuracy": 65,
//     "elevation": 16.439998626708984,
//     "speed": -1,
//     "tilt": 0,
//     "heading": -1,
//     "heartrate": 0,
//     "time": "2018-10-26T13:50:15.584Z",
//     "notes": ""
//   },
//   "Kayleigh's iPhone": {
//     "uuid": "B303CA8D-B199-4526-ADAC-FDA34696FB70",
//     "id": 0,
//     "name": "Kayleigh's iPhone",
//     "lat": 38.62228775024414,
//     "long": -90.23755645751953,
//     "accuracy": 65,
//     "elevation": 158.66403198242188,
//     "speed": -1,
//     "tilt": 0,
//     "heading": -1,
//     "heartrate": 0,
//     "time": "2018-10-22T15:39:39.539Z",
//     "notes": "{\"floorsAscended\":0,\"customNote\":\"\",\"currentTripStart\":\"2018-10-22T13:06:09.184Z\",\"floorsDescended\":0,\"averageActivePace\":0.87531100477783375,\"numberOfSteps\":547,\"relativeAltitude\":0,\"currentCadence\":1.6991448402404785,\"activity\":\"Stationary\",\"currentPace\":0.77753710746765137,\"pressure\":0,\"distance\":358.89475801773369}"
//   },
//   "Kitty’s MacBook Pro": {
//     "uuid": "B2490ACA-E64F-40C2-8903-638AFF6E6EE4",
//     "id": 0,
//     "name": "Kitty’s MacBook Pro",
//     "lat": 37.44910430908203,
//     "long": -122.27674102783203,
//     "accuracy": 5,
//     "elevation": 0,
//     "speed": 35.36000061035156,
//     "tilt": 0,
//     "heading": 310.7799987792969,
//     "heartrate": 0,
//     "time": "2018-05-26T13:40:22.916Z",
//     "notes": "{\"pressure\":0,\"numberOfSteps\":0,\"distance\":0,\"relativeAltitude\":0,\"averageActivePace\":0,\"activity\":\"Unknown\",\"currentCadence\":0,\"floorsAscended\":0,\"currentPace\":0,\"currentTripStart\":\"2018-05-26T13:26:46.606Z\",\"customNote\":\"\"}"
//   },
//   "P2": {
//     "uuid": "729D4E76-9408-4805-A187-BD3D72BABFFF",
//     "id": 0,
//     "name": "P2",
//     "lat": 38.604434967041016,
//     "long": -90.229736328125,
//     "accuracy": 65,
//     "elevation": 163.39080810546875,
//     "speed": -1,
//     "tilt": 0,
//     "heading": -1,
//     "heartrate": 0,
//     "time": "2018-10-26T15:25:55.411Z",
//     "notes": "{\"floorsAscended\":0,\"customNote\":\"\",\"currentTripStart\":\"2018-10-22T02:59:28.745Z\",\"floorsDescended\":0,\"averageActivePace\":0,\"numberOfSteps\":0,\"relativeAltitude\":0,\"currentCadence\":0,\"activity\":\"Stationary\",\"currentPace\":0,\"pressure\":0,\"distance\":0}"
//   },
//   "Rye8": {
//     "uuid": "2F357B63-9C1F-41FB-9605-93E45D6D448B",
//     "id": 0,
//     "name": "Rye8",
//     "lat": 38.64745330810547,
//     "long": -90.27598571777344,
//     "accuracy": 65,
//     "elevation": 146.97579956054688,
//     "speed": -1,
//     "tilt": 0,
//     "heading": -1,
//     "heartrate": 0,
//     "time": "2018-10-26T18:04:28.609Z",
//     "notes": "{\"floorsAscended\":0,\"customNote\":\"\",\"currentTripStart\":\"2018-10-26T17:44:04.130Z\",\"floorsDescended\":0,\"averageActivePace\":0,\"numberOfSteps\":0,\"relativeAltitude\":1.9024658203125,\"currentCadence\":0,\"activity\":\"Stationary\",\"currentPace\":0,\"pressure\":98.877777099609375,\"distance\":0}"
//   },
//   "RyePhone": {
//     "uuid": "AAECF823-2D5E-44B5-83CC-A0CDBE04AEC8",
//     "id": 0,
//     "name": "RyePhone",
//     "lat": 38.64742,
//     "long": -90.27564,
//     "accuracy": 10,
//     "elevation": 165.1669,
//     "speed": 0,
//     "tilt": 0,
//     "heading": -1,
//     "heartrate": 0,
//     "time": "2018-10-26T00:39:14Z",
//     "notes": "{\"floorsDescended\":0,\"numberOfSteps\":0,\"floorsAscended\":0,\"currentTripStart\":\"2018-10-26T00:37:40.760Z\",\"activity\":\"Unknown\",\"customNote\":\"cat\",\"currentPace\":0,\"relativeAltitude\":0,\"distance\":0,\"averageActivePace\":0,\"currentCadence\":0,\"pressure\":0}"
//   },
//   "Twenty7": {
//     "uuid": "B5F8BB33-C010-47C0-A6ED-755BF7549DA0",
//     "id": 0,
//     "name": "Twenty7",
//     "lat": 33.86307144165039,
//     "long": -118.37136840820312,
//     "accuracy": 10,
//     "elevation": 37.05802536010742,
//     "speed": 0,
//     "tilt": 0,
//     "heading": -1,
//     "heartrate": 0,
//     "time": "2018-10-26T12:26:45.004Z",
//     "notes": ""
//   },
//   "iPhone": {
//     "uuid": "49E78967-1891-4364-8910-2DA90B063C0C",
//     "id": 0,
//     "name": "iPhone",
//     "lat": 62.905555725097656,
//     "long": 18.349388122558594,
//     "accuracy": 10,
//     "elevation": 37.3433837890625,
//     "speed": 0.7799999713897705,
//     "tilt": 0,
//     "heading": 137.4609375,
//     "heartrate": 0,
//     "time": "2018-05-22T14:30:50Z",
//     "notes": "roadtrip"
//   },
//   "jl": {
//     "uuid": "",
//     "id": 0,
//     "name": "jl",
//     "lat": 51.537466563390566,
//     "long": 10.064866563390568,
//     "accuracy": 0,
//     "elevation": 0,
//     "speed": 0,
//     "tilt": 0,
//     "heading": 0,
//     "heartrate": 0,
//     "time": "0001-01-01T00:00:00Z",
//     "notes": "json web post"
//   },
//   "ubp52": {
//     "uuid": "",
//     "id": 0,
//     "name": "ubp52",
//     "lat": 59.3326,
//     "long": 18.0649,
//     "accuracy": 0,
//     "elevation": 0,
//     "speed": 0,
//     "tilt": 0,
//     "heading": 0,
//     "heartrate": 0,
//     "time": "2018-10-16T23:23:01Z",
//     "notes": ""
//   }
// }

// {"KeyN":314099,"KeyNUpdated":"2018-10-25T19:09:54.850037684Z","LastUpdatedAt":"2018-10-26T18:04:30.581047064Z","LastUpdatedBy":"Rye8","LastUpdatedPointsN":1097,"TileDBLastUpdated":"2018-10-26T09:16:54.304260747-07:00"}
