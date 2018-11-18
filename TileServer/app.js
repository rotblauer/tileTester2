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

// cat:[lat,lng]
var lastcatlocations = {};

var visits = [];

var onMapCatMarkers = [];

var catsToVisit = {}; // uuid:name
var catVisitMarkers = [];
var vvisits = {};
var lastAskedVisit;

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
var mb_tile_caliterr_url = "https://api.mapbox.com/styles/v1/rotblauer/cjok2q3ao6gfx2rlmioipy394/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoicm90YmxhdWVyIiwiYSI6ImNpeTdidjZxajAwMzEycW1waGdrNmh3NmsifQ.OpXHPqEHK2sTbQ4-pmhAMQ";
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
var mb_tile_caliterr = L.tileLayer(mb_tile_caliterr_url, {
    maxZoom: 19
});

function isSmallScreen() {
    if (/Android|webOS|iPhone|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent)) {
        return true;
    }
    return false;
}

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
        } else if (current_tile_layer === mb_tile_caliterr) {
            return "tile-caliterr";
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
    var vv = $("#visits-checkbox").is(":checked") ? "yes" : "no";
    var text = wl + "?z=" + z +
        "&y=" + lng +
        "&x=" + lat +
        "&l=" + drawnLayer +
        "&t=" + getCurrentTileLayerName() +
        "&s=" + globalSinceFloor +
        "&v=" + vv;
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

    if (isSmallScreen()) {
        // don't take up screen space talking about more unseen points if the screen is kind of small already
        return;
    }

    $(".other-places-div").each(function(i, t) {
        $(t).html("");
    });
    // $("#url-moved").css("color", "rgb(5, 255, 170)");
    // $("#url-moved").fadeOut(100).fadeIn(100); // .fadeOut(100).fadeIn(100);
    $("#cat-in-frame").html("");
    $(".catware").each(function(i, e) {
        $(e).remove();
    });
    for (var i = 0; i < onMapCatMarkers.length; i++) {
        var layer = onMapCatMarkers[i];
        // var txt = $("#" + layer.options.title).html();
        if (!map.getBounds().contains(layer.getLatLng())) {
            // if (typeof txt !== "undefined" && txt.indexOf("-") === 0) {
            //     $("#" + layer.options.title).html(txt.slice(1));
            // } else {
            //     console.error("huh", layer.options.title, txt);
            // }
        } else {
            // if (typeof txt != "undefined" && txt.indexOf("-") < 0) {
            //     $("#" + layer.options.title).html("-" + txt);
            // }
            var viss = [];
            for (k in vvisits) {
                var v = vvisits[k];
                // console.log("k/vvisits", k, v);
                if (layer.options.title === v.name || colors[layer.options.title] === colors[v.name]) {
                    if (!map.getBounds().contains(L.latLng(v.PlaceParsed.Lat, v.PlaceParsed.Lng)) && new Date(v.DepartureTime).getFullYear() < 4000 && new Date(v.ArrivalTime).getFullYear() > 1000) {
                        viss.push(v);
                    } else {}
                } else {
                    // console.warn(layer.options.title, "dne", v.name);
                }
            }
            if (viss.length > 0) {
                var catawarebox = $("<div></div>");
                catawarebox.addClass("catware");
                // catawarebox.css("margin-left", "1em");
                // catawarebox.css("margin-bottom", "1em");
                catawarebox.css("padding-right", "1em");
                catawarebox.css("padding-left", "1em");

                catawarebox.css("text-align", "right");
                catawarebox.css("background-color", (current_tile_layer === mb_tile_dark ? "black" : "white"));
                catawarebox.css("color", (current_tile_layer === mb_tile_dark ? "white" : "black"));
                catawarebox.css("font-size", "0.8em");
                // catawarebox.css("font-weight", "bold");

                var namer = $("<span></span>");
                // namer.css("background-color", colors[layer.options.title]);
                namer.text(layer.options.title);
                catawarebox.append(namer);

                var namerexplan = $("<span></span>");
                // namerexplan.css("background-color", colors[layer.options.title]);
                namerexplan.text(" has " + viss.length + " other " + (viss.length > 1 ? "visits" : "visit") + " out of view");
                catawarebox.append(namerexplan);

                var list = $("<div></div>");
                for (var j = 0; j < viss.length; j++) {
                    var linker = $("<p class='link link-to-other-place' style='margin-bottom: 0px;'></p>");
                    linker.html("<img src='/map-icon-red.png' style='height: 1em;'/> " + viss[j].PlaceParsed.Identity + ", " + moment(viss[j].ReportedTime).from(moment()));
                    var lat = viss[j].PlaceParsed.Lat;
                    var lng = viss[j].PlaceParsed.Lng;
                    linker.attr("data-lat", lat);
                    linker.attr("data-lng", lng);
                    linker.on("click", function(e) {
                        map.flyTo([+e.target.dataset.lat, +e.target.dataset.lng]);
                    });

                    // var mapdomr = $("#map")[0].getBoundingClientRect();
                    // console.log("mapboxd", mapdomr);
                    // // mapboxd
                    // // DOMRect {x: 0, y: 20, width: 1198, height: 872, top: 20, …}
                    // // bottom: 892
                    // // height: 872
                    // // left: 0
                    // // right: 1198
                    // // top: 20
                    // // width: 1198
                    // // x: 0
                    // // y: 20

                    // var mapbounds = map.getBounds();
                    // console.log("mapbounds", mapbounds);
                    // // mapbounds o.LatLngBounds {_southWest: o.LatLng, _northEast: o.LatLng}_northEast: o.LatLng {lat: 38.647930517779514, lng: -90.25753498077393}_southWest: o.LatLng {lat: 38.63331569814948, lng: -90.28324127197267}__proto__: Object
                    // // eg. mapbounds._southWest.lat

                    // var mapcenter = map.getCenter();
                    // console.log("mapcenter", mapcenter);
                    // // mapcenter
                    // // o.LatLng {lat: 38.640170955984765, lng: -90.27109622955322}
                    // // lat: 38.640170955984765
                    // // lng: -90.27109622955322
                    // // __proto__: Object

                    // // map dimensions in degrees
                    // var mapHdg = mapbounds._northEast.lat - mapbounds._southWest.lat;
                    // var mapWdg = mapbounds._northEast.lng - mapbounds._southWest.lng;

                    // var mWPx_Dg = mapWdg / mapdomr.width; // pixels/degree
                    // var mHPx_Dg = mapHdg / mapdomr.height;


                    // // diff degrees center to trackpoint
                    // var dlatdg = mapcenter.lat - lat;
                    // var dlngdg = mapcenter.lng - lng;

                    // var wantHPxCoord = mHPx_Dg * dlatdg;
                    // var wantWPxCoord = mWPx_Dg * dlngdg;

                    // console.log("want", wantWPxCoord, wantHPxCoord);

                    // var edgeHPxCoord;
                    // if (wantHPxCoord < map.top) { edgeHPxCoord = map.top } else if (wantHPxCoord > map.bottom) {edgeHPxCoord = map.bottom};

                    // var edgeWPxCoord = wantWPxCoord < map.left ? map.left : wantWPxCoord;
                    // edgeWPxCoord = wantWPxCoord > map.right ? map.right : wantWPxCoord;



                    // linker.css("position", "fixed");
                    // linker.css("x", edgeWPxCoord + "px");
                    // linker.css("y", edgeHPxCoord + "px");
                    // linker.css("z-index", 1000);
                    // $("body").append(linker);
                    // console.log("GOT OOB", "x", edgeWPxCoord, "y", edgeHPxCoord, linker);


                    // // var triHdg = mapcenter.lat - lat;
                    // // var triWdg = mapcenter.lng - lng;

                    // // var smtriHdg = mapcenter.lat - mapbounds._southwest.lat;
                    // // var smtriWdg = mapcenter.lng - mapbounds._

                    list.append(linker);
                    // find aliasable cat
                    $(".other-places-div").each(function(e, tar) {
                        if (colors[tar.id.replace("other-places-", "")] === colors[viss[j].name]) {
                            // $(tar).append(linker);
                        } else {
                            // console.warn(tar.id, "dneq", viss[j].name);
                        }
                    });
                }
                catawarebox.append(list);
                $("#lastknowns").append(catawarebox);
                // $("#cat-in-frame").append(catawarebox);
                // $("#cat-in-frame").append(list);
                console.log("vvisss not on map curr", viss);
            }
        }
    }
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
    } else if (name === "tile-caliterr" && current_tile_layer !== mb_tile_caliterr) {
        setMapTileLayer(mb_tile_caliterr);
    }

    if (name === "tile-dark" && current_tile_layer !== mb_tile_dark) {
        setMapTileLayer(mb_tile_dark);
        // $("#metadata-holder").css("background-color", "black");
        // $("#metadata").css("color", "white");
        $("body").css("background-color", "black");

    } else {
        // $("#metadata-holder").css("background-color", "white");
        // $("#metadata").css("color", "black");
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
    if (highlight !== null) {
        // pbfLayer.resetFeatureStyle(highlight);
        // pbfDevopLayer.resetFeatureStyle(highlight);
        // pbfEdgeLayer.resetFeatureStyle(highlight);
        // pbfPlacesLayer.resetFeatureStyle(highlight);
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
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [16, 16]
});

var arrivedPinIcon = L.icon({
    // iconUrl: "/green-map-pin.png",
    // iconUrl: "/green-pin-icon2.png",
    iconUrl: "/green-pin-icon3.png",
    // iconSize: [25,36],
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [16, 16]
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
    if (!properties.clustered) {
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
    // interactive: true, // Make sure that this VectorGrid fires mouse/pointer events
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
    // interactive: true, // Make sure that this VectorGrid fires mouse/pointer events
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
    if (globalSinceFloor !== "") {
        // console.log("recent globalSinceFloor", globalSinceFloor);
        if (new Date().getTime() - new Date(props.Time).getTime() > +globalSinceFloor * 24 * 60 * 60 * 1000) {
            return {};
        }
        if (new Date().getTime() - new Date(props["ArrivalTime"]).getTime() > +globalSinceFloor * 24 * 60 * 60 * 1000) {
            return {};
        }
    }
    var c = activityColorLegend[props["Activity"]];
    if (c === "lightgray") {
        return {};
    }
    var out = {
        stroke: false,
        fill: true,
        fillColor: c || "lightgray",
        fillOpacity: c !== "lightgray" ? 0.9 : 0.1,
        // radius: 1.5,
        radius: 2,
        type: "Point"
    };
    // if (layer === "catTrackPlace") {
    //     // console.log("propes", properties);
    //     // console.log("year", year);
    //     // out.fill= false;
    //     out.type = "Icon";
    //     out.icon = placePinIcon;

    //     var year = new Date(props["DepartureTime"]).getFullYear();
    //     if (year >= 4000) {
    //         return {};
    //         // out.icon = arrivedPinIcon;
    //     } else if (year < 1000) {
    //         return {};
    //     }
    // }

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
    interactive: true,
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
        console.log("activeity", k, v);
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

function isVisitsOn(val) {
    if (typeof val === "undefined" || val == null || val.toLowerCase() === "no") {
        return false;
    }
    return true;
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
    var visitsOn = getQueryVariable("v", pos)
    if (z) {
        zoom = +(z) // cast to float
    }
    if (y) {
        center[1] = +(y)
    }
    if (x) {
        center[0] = +(x)
    }

    if (!visitsOn) {
        visitsOn = "yes";
    }
    if (isVisitsOn(visitsOn)) {
        $("#visits-checkbox").attr("checked", true);
        $("#visits-checkbox").val("yes");
        getCatVisits();
    } else {
        visitsOn = "no";
        $("#visits-checkbox").attr("checked", false);
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
        delegateTileLayer("tile-caliterr");
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
                moment(data["KeyNUpdated"]).fromNow(true).replace("a ", "").replace("an ", "") + "." +
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

var clusterLayers = []; // by holding layers INSIDE a globally scoped variable, we avoid out-of-scope issues when trying to map..add/map.remove same-scoped variables, eg. if this were just 'var clusterLayer;'

// returns L.marker
function makeVisitMarker(val) {

    var y = new Date(val["ArrivalTime"]).getFullYear();
    var l = L.marker([+val.PlaceParsed.Lat, +val.PlaceParsed.Lng], {
        icon: y < 4000 && y > 1000 ? placePinIcon : arrivedPinIcon,
    }).on('click', function(e) {
        console.log("clicked", val);

        var props = val;
        // alert(props.Name + " visited " + props.PlaceIdentity + "\n" + "From " + props.ArrivalTime + " to " + props.DepartureTime);
        var start = moment.tz(props.ArrivalTime, tzlookup(+val.PlaceParsed.Lat, +val.PlaceParsed.Lng));
        var end = moment.tz(props.DepartureTime, tzlookup(+val.PlaceParsed.Lat, +val.PlaceParsed.Lng));

        var timeSpent = end.to(start, true);

        var relTime = ", " + moment(props.ArrivalTime).from(moment());

        // var af = moment(props.ArrivalTime);
        // var df = moment(props.DepartureTime);

        // var googlePlaceName = "";
        // if (val.googleNearby.Results && val.googleNearby.Results.length > 0) {
        //     var results = val.googleNearby.Results;
        //     for (var i = 0; i < results.length; i++) {
        //         var r = results[i];
        //         // and here's where the magic happens
        //         // if (r.r.vicinity.substring(0, r.vicinity.indexOf(",")))
        //         // if (r.vicinity.includes(val.PlaceParsed.Identity)) {
        //         if (r.vicinity.substring(0, 4) === val.PlaceParsed.Identity.substring(0,4)) {
        //             googlePlaceName = r.name + " at ";
        //         }
        //     }
        // }

        // var str = props.name + " visited " + googlePlaceName + props.PlaceParsed.Identity + " for " + timeSpent + relTime + ", on " + af.format("dddd, MMMM Do") + ", from " + af.format("LT") + " to " + df.format("LT");
        // if (end.year() >= 3000) {
        //     str = props.name + " arrived at " + googlePlaceName + props.PlaceParsed.Identity + relTime + ", on " + af.format("llll");
        // } else if (start.year() < 1000) {
        //     str = props.name + " left " + googlePlaceName + props.PlaceParsed.Identity + relTime + ", on " + df.format("llll");
        // }

        var str = props.name + " visited " + props.PlaceParsed.Identity + " for " + timeSpent + relTime + ", on " + start.format("dddd, MMMM Do") + ", from " + start.format("LT") + " to " + end.format("LT");
        if (end.year() >= 3000) {
            str = props.name + " arrived at " + props.PlaceParsed.Identity + relTime + ", on " + start.format("llll");
        } else if (start.year() < 1000) {
            str = props.name + " left " + props.PlaceParsed.Identity + relTime + ", on " + end.format("llll");
        }
        str += " (local time)";

        var firstphoto = "";
        var photoshtml = "";
        var photoshtmllim = 0;
        var nearly = "";
        var nearbylim = 0;

        if (val.googleNearby.Results && val.googleNearby.Results.length > 0) {
            str += "<br>";
            var results = val.googleNearby.Results;
            // types not includes political, route, locality
            // var blisttypes = ["political", "route", "locality"];
            var blisttypes = ["locality"];
            for (var i = 0; i < results.length; i++) {
                var r = results[i];
                // vicinity includes comma
                // if (r.vicinity.indexOf(",") < 0) {
                //     continue;
                // }
                var blacklisted = false;
                for (var j = 0; j < blisttypes.length; j++) {
                    var t = blisttypes[j];
                    if (r.types.indexOf(t) >= 0) {
                        blacklisted = true;
                    }
                }
                if (blacklisted) continue;

                try {
                    if (firstphoto === "") {
                        // firstphoto = "<img src='data:image/png;base64," + val.googleNearbyPhotos[r.photos[0]["photo_reference"]] + "' style='width: 300px;' />";
                        firstphoto = "<img src='" + trackHost + "/googleNearbyPhotos?photoreference=" + encodeURIComponent( r.photos[0]["photo_reference"] ) + "' style='width: 300px;' />";
                    } else {
                        // limit detail photos, and don't show dupes
                        if (photoshtmllim <= 3 && photoshtml.indexOf(r.photos[0]["photo_reference"]) < 0) {
                            // photoshtml = photoshtml + "<img src='data:image/png;base64," + val.googleNearbyPhotos[r.photos[0]["photo_reference"]] + "' style='max-width: 75px;' />";
                            photoshtml = photoshtml + "<img src='" + trackHost + "/googleNearbyPhotos?photoreference=" + encodeURIComponent( r.photos[0]["photo_reference"] ) + "' style='max-width: 75px;' />";
                            photoshtmllim++;
                        }
                    }
                } catch(err) {
                    console.error("err photo", err);
                    // console.debug("val", val);
                    // console.debug("photos", val.googleNearbyPhotos);
                    // try {

                    //     str += "<img src='data:image/jpeg;base64," + val.googleNearbyPhotos[r.photos[0]["photo_reference"]] + "' style='width: 200px;' /><br>";
                    // } catch(err2) {
                    //     console.error("couldn't load image", r.name, val.googleNearbyPhotos[r.photos[0]["photo_reference"]], err2);
                    // }
                }

                if (nearbylim <= 3) {
                    nearly += "<img src='" + r.icon + "' style='height: 10px;' />" + " " + r.name + "<br>";
                    nearbylim++;
                } else {
                    // break;
                }
            }
        }

        str = firstphoto + (firstphoto.length > 0 ? "<br>" : "") + photoshtml + "<p>" + str + "</p>" + "Nearby:<br>" + nearly;
        //     + str + "<br>";
        // str +=
        // str += "<br>" + photoshtml;

        L.popup()
            .setContent(str)
            // 					.setContent(JSON.stringify(e.layer))
            .setLatLng(e.latlng)
            .openOn(map);
        clearHighlight();
        highlight = true; // e.osm_id;
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
    return l;
}

// https://stackoverflow.com/questions/18883601/function-to-calculate-distance-between-two-coordinates-shows-wrong
//This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)
function calcCrow(lat1, lon1, lat2, lon2) {
    var R = 6371; // km
    var dLat = toRad(lat2 - lat1);
    var dLon = toRad(lon2 - lon1);
    var lat1 = toRad(lat1);
    var lat2 = toRad(lat2);

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d;
}

// Converts numeric degrees to radians
function toRad(Value) {
    return Value * Math.PI / 180;
}

function getCatVisits() {

    if (!$("#visits-checkbox").is(":checked")) return;

    if (catsToVisit.length === 0) {
        setTimeout(getCatVisits, 1000);
        return;
    }

    var cats = "";
    for (uuid in catsToVisit) {
        cats += "names=" + catsToVisit[uuid] + "&";
    }


    $.ajax({
        type: "GET",
        url: trackHost + "/visits?" + cats + (lastAskedVisit === null || catVisitMarkers.length === 0 ?
                "startReportedT=" + moment().add(-14, "days").format() :
                "startReportedT=" + moment(lastAskedVisit).add(-1, "minute").format()) +
            "&endI=100&stats=true&googleNearby=true", // + "&googleNearbyPhotos=true",
        dataType: 'json',
        success: function(data) {
            console.log("visits", data);
            lastAskedVisit = moment();

            // if (lmc !== null){  map.removeLayer(lmc); };
            // for (var i = 0; i < clusterLayers; i++) {
            //     map.remove(clusterLayers[i]);
            // }

            var lmc = clusterLayers[0] || L.markerClusterGroup();

            // let's allow arrival visits only for first (most recent) visit PER CAT
            var catvisits = {};

            $.each(data.visits, function(i, val) {

                // FIXME: better logic; not all only-arrivals or only-departures becomes full visits.
                if (!(new Date(val.ArrivalTime).getFullYear() > 1000 && new Date(val.DepartureTime).getFullYear() < 3000) && catvisits.hasOwnProperty(val.name)) {
                    console.log("half-formed visit", val);
                    return;
                }
                catvisits[val.name] = true;
                if (!vvisits.hasOwnProperty(val.name + val.ReportedTime)) {
                    vvisits[val.name + val.ReportedTime] = val;
                } else {
                    return;
                }
                // console.log("v", i, val);
                var l = makeVisitMarker(val);
                // map.addLayer(l);
                catVisitMarkers.push(l);
                lmc.addLayer(l);
            });
            if (clusterLayers.length === 0) map.addLayer(lmc);
            clusterLayers.push(lmc);


            setTimeout(getCatVisits, 60 * 5 * 1000);
        },
        error: function(e) {
            console.error("err getting cat visits", e)
        }

        // , error:
    });
}

// getCatVisits();

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


function getAndMakeButtonsForLastKnownCats() {
    // $("#metadata").hide();
    $.ajax({
        type: 'GET',
        url: lastKnownJSONurl,
        dataType: 'json',
        success: function(data) {
            // $("#metadata-holder").css("background-color", "black");
            console.log("data getandmakebuttonsforlastknowncats", data);

            if (!isSmallScreen()) $("#metadata").show();

            // $(".lastknownlink").each(function(i, e) {
            //     $(e).remove();
            // });
            $("#lastknowns").html("");

            // in case any existing already, remove em
            for (var i = 0; i < onMapCatMarkers.length; i++) {
                var cat = onMapCatMarkers[i];
                // cat.setIcon(catIconSmall);
                // cat.setOpacity(1/i);
                map.removeLayer(cat);
            }
            onMapCatMarkers = [];

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
                // ignore the old ones

                // override because we used colors as alias for identity, now we want names back to avoid refactoring
                var oVal = val;
                val = val[0];
                key = val["name"]; // key was color

                if (moment(val["time"]).add(3, 'days').isBefore(moment())) {
                    return;
                }

                if (!catsToVisit.hasOwnProperty(val["uuid"])) {
                    catsToVisit[val["uuid"]] = val["name"];
                }
                // don't worry about removing visits for old cats yet. that'll happen on page reload unless you stare at maps for daze like i do

                // if (val.hasOwnProperty("notes") && val["notes"] !== "") {
                //     console.log(key, "steps", JSON.parse(val["notes"]));
                // }

                // var n = val["name"];
                var n = key;
                // if (oVal.length > 1) {
                //     n += "<sup>" + oVal.length + "</sup>";
                // }

                var l = L.marker([+val["lat"], +val["long"]], {
                    icon: catIcon,
                    title: val["name"],
                    alt: val["name"] + "_" + val["uuid"],
                });

                var isinmapsymbol = "";
                // var isinmapsymbol = "-";
                // if (!map.getBounds().contains(l.getLatLng())) {
                // isinmapsymbol = "";
                // }

                var button = $("<div id='" + key + "' class='lastknownlink' style=''></div>");
                button.data("lat", val["lat"] + "");
                button.data("long", val["long"] + "");
                button.css("z-index", 10000);

                var btitle= $("<p></p>");
                btitle.text(isinmapsymbol + n + ", " + moment(val["time"]).fromNow() );
                btitle.css("margin-bottom", "0");
                button.append(btitle);

                if (val.notes !== "") {
                    var bsubtitle = $("<p></p>");
                    bsubtitle.css("font-size", "0.8em");
                    bsubtitle.css("margin-bottom", "0");
                    bsubtitle.addClass("catsubtitle");

                    var subtitle = "";
                    var no = JSON.parse(val.notes);
                    subtitle += "" + no.activity + ", pace: " + no.currentPace.toFixed(2) + " altitude: " + val.elevation.toFixed(0) + "m<br>" + no.numberOfSteps + " steps, distance: " + ( no.distance/1 ).toFixed(0) + "m since " + moment(no.currentTripStart).from(moment());
                    bsubtitle.html(subtitle);
                    button.append(bsubtitle);
                    bsubtitle.hide();
                }
                lastcatlocations[key] = [+val["lat"], +val["long"]];

                // posterior other cat places div for cat/s in map (out of view visits)
                var catotherps = $("<div id='other-places-" + key + "' class='other-places-div'></div>");

                var c = "#21DBEB";
                if (colors.hasOwnProperty(val["name"])) {
                    c = colors[val["name"]];
                    button.css("background-color", c);
                    button.css("color", "white");
                }
                $("#lastknowns").append(button);
                $("#lastknowns").append(catotherps);

                map.addLayer(l);
                onMapCatMarkers.push(l);

                $(document).on('click', '.lastknownlink', function(e) {
                    var lat = $(this).data("lat");
                    var lng = $(this).data("long");
                    map.setView([+lat, +lng]);
                    $(".catsubtitle").hide();
                    $(this).find(".catsubtitle").show();
                });
            });
            getmetadata();
            setTimeout(getAndMakeButtonsForLastKnownCats, 1000 * 60); // re-call again in a minute
        },
        error: function(err) {
            console.error("err", err);
            if (!isSmallScreen()) $("#metadata").show();
            // $("#metadata-holder").css("background-color", "rgb(249, 133, 0)");
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

if (isSmallScreen()) $("#metadata").hide();

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

$("#visits-checkbox").on("change", function() {
    var on = $(this).is(":checked");
    console.log("vc change", on);
    var visitsOn = "yes";
    if (!on) {
        visitsOn = "no";
    }

    if (isVisitsOn(visitsOn)) {
        // $("#visits-checkbox").attr("checked", true);
        if (clusterLayers.length > 0) {
            map.addLayer(clusterLayers[0]);
        }
        getCatVisits();
    } else {
        map.removeLayer(clusterLayers[0]);
    }
    putViewToUrl(buildViewUrl());
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

// $("#metadata-holder").css("top", $("#map")[0].getBoundingClientRect().top);
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
