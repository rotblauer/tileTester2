// color defaults
var color_ia="rgb(255,0,0)"; //"rgb(254,65,26)"; // "rgb(235,41,0)";
var color_jl="rgb(0,0,255)";// "rgb(0,162,235)";
var color_jl_meta="rgb(70, 97, 152)";
var color_ia_meta="#c42c21";
var jl_names=["RyePhone", "Rye8", "jl"];
var ia_names=["Big Papa", "Bigger Papa"];
var colors = {
    "Big Papa": color_ia,
    "Bigger Papa": color_ia,

    "RyePhone": color_jl,
    "Rye8": color_jl,
    "jl": color_jl,

    "Big Mamma": "rgb(176,16,221)",
    "Kayleigh's iPhone": "rgb(200,200,0)",

    // matt
    "Twenty7": "rgb(20, 83, 94)",

    // chris
    "iPhone": "rgb(27,142,29)",
    "Chishiki": "rgb(27,142,29)"
};

var url = 'http://punktlich.rotblauer.com:8081/tiles/{z}/{x}/{y}';
var lastKnownJSONurl = 'http://track.areteh.co:3001/lastknown';
var metadataURL = 'http://track.areteh.co:3001/metadata';
// url = 'http://localhost:8080/tiles/{z}/{x}/{y}';
var defaultCenter = [38.6270, -90.1994];
var defaultZoom = 8;
var didLogOnce = false;
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

var drawnLayer = "speed";
var pbfLayer;
var drawnFeatures = [];
var map;
var current_tile_layer;
var mb_tile_outdoors_url = "https://api.mapbox.com/styles/v1/rotblauer/cjgejdj91001c2snpjtgmt7gj/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoicm90YmxhdWVyIiwiYSI6ImNpeTdidjZxajAwMzEycW1waGdrNmh3NmsifQ.OpXHPqEHK2sTbQ4-pmhAMQ";                            
var mb_tile_light1_url = "https://api.mapbox.com/styles/v1/rotblauer/ciy7ijqu3001a2rocq88pi8s4/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoicm90YmxhdWVyIiwiYSI6ImNpeTdidjZxajAwMzEycW1waGdrNmh3NmsifQ.OpXHPqEHK2sTbQ4-pmhAMQ";
var mb_tile_sat_url = "https://api.mapbox.com/styles/v1/rotblauer/cjgel0gt300072rmc2s34f2ky/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoicm90YmxhdWVyIiwiYSI6ImNpeTdidjZxajAwMzEycW1waGdrNmh3NmsifQ.OpXHPqEHK2sTbQ4-pmhAMQ";
var mb_tile_light1 = L.tileLayer(mb_tile_light1_url, {
    maxZoom: 19
})
var mb_tile_outdoors = L.tileLayer(mb_tile_outdoors_url, {
    maxZoom: 19
})
var mb_tile_sat = L.tileLayer(mb_tile_sat_url, {
    maxZoom: 19
})
function getCurrentTileLayerName() {
    if (current_tile_layer !== null) {
        if (current_tile_layer === mb_tile_light1) {
            return "tile-light";
        } else if (current_tile_layer === mb_tile_outdoors) {
            return "tile-outdoors";
        }  else if (current_tile_layer === mb_tile_sat) {
            return "tile-sat";
        }
    }
    return ""
}
function buildViewUrl() {
    var latlng = map.getCenter();
    var lat = latlng.lat;
    var lng = latlng.lng;
    var z = map.getZoom();
    var text = "http://punktlich.rotblauer.com?z=" + z 
        + "&y=" + lng 
        + "&x=" + lat 
        + "&l=" + drawnLayer 
        + "&t=" + getCurrentTileLayerName();
    return text;
}
function putViewToUrl() {
    var t = buildViewUrl();
    setBrowsePosition(t);
    document.getElementById("url-location").innerHTML = t;
}
map = L.map('map', {
    maxZoom: 20,
    noWrap: true
    // preferCanvas: true
});
map.on("moveend", function() {
    didLogOnce = false;
    putViewToUrl();
    $("#url-moved").css("color", "rgb(5, 255, 170)");
    $("#url-moved").fadeOut(100).fadeIn(100); // .fadeOut(100).fadeIn(100);
});
map.on("load", function() {
    putViewToUrl();
    $("#url-moved").css("color", "white"); 
});
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

function onEachFeature(feature) {
}


function setMapTileLayer(tile_layer) {
    if (pbfLayer !== null && typeof pbfLayer !== "undefined") {map.removeLayer(pbfLayer);}
    if (current_tile_layer !== null && typeof current_tile_layer !== "undefined") {
        console.log("removing current tile layer");
        map.removeLayer(current_tile_layer);
    }
    current_tile_layer = tile_layer;
    map.addLayer(current_tile_layer);  
    if (pbfLayer !== null && typeof pbfLayer !== "undefined") {map.addLayer(pbfLayer);}
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

    $('.tile-button').css("border", "none");
    $('.tile-button').css("border-radius", "0 0 0 0");
    $('button#'+name).css("border-left", "8px solid rgba(65, 123, 229, 0.36)");
    $('button#'+name).css("border-radius", "4px 0px 0px 4px");
}

$(".tile-button").on("click", function(e) {
    var id = $(this).attr("id");
    delegateTileLayer(id);
    putViewToUrl();
});

var highlight;
var clearHighlight = function() {
    if (highlight) {
        pbfLayer.resetFeatureStyle(highlight);
    }
    highlight = null;
};



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
                fillOpacity: 0.1,
                radius: radiusFromSpeed(properties.Speed, zoom),
                type: "Point"
            };
        }
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
function densityColor(density){
    var r = Math.floor(density*2),
        g = Math.floor(255-density),
        b = 0;
    return  "rgb(" + r + "," + g + "," + b + ")";
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
    var stepSize = maxDensity/zRangeDiff; // 255 / 17 = 15
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
    var lower = maxDensity - (stepN*stepSize);
    if (n < lower) {
        n = lower;
    }
    var mldiff = maxDensity - lower;
    var rel = n - lower;
    var relDensity = rel/mldiff;
    return relDensity;
}

var densityTileOptions = {
    rendererFactory: L.canvas.tile,
    vectorTileLayerStyles: {

        'catTrack': function(properties, zoom) {

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
            var relAbsoluteDensity = (properties.tippecanoe_feature_density/(maxDensity*(zRangeMin/zoom))); // scale max density by zoom linearly
            var relAbsoluteDensityPercent = Math.floor(relAbsoluteDensity*100);

            // var relD = getRelDensity(zoom, properties.tippecanoe_feature_density);
            // var relDPercent = Math.floor(relD*100);

            var out = {
                stroke: false,
                fill: true,
                fillColor: function() {
                    var factor = properties.sqrt_point_count;
                    factor = factor * (zoom/zRangeMax)*2;
                    if (zoom <= 8 && zoom > 5) {
                        factor = factor * (zoom / zRangeDiff);
                    }
                    if (zoom <= 5) {
                        factor = properties.point_count * (zoom / zRangeDiff); // / (zoom/(zoom+1-zRangeMin));
                    }
                    var n = percentToRGB(relAbsoluteDensityPercent*factor); // densityColor(properties.tippecanoe_feature_density),
                    return n;
                }(),
                // fillColor: percentToRGB(relDPercent), // densityColor(properties.tippecanoe_feature_density),
                // fillOpacity: 0.05, // (properties.points_count*0.55)/100, // 0.1, //relAbsoluteDensity//0.10 ,
                fillOpacity: 0.05 * (zoom/zRangeDiff), // (properties.points_count*0.55)/100, // 0.1, //relAbsoluteDensity//0.10 ,
                radius: function() {
                    var n = 0;
                    if (zoom > 14) {
                        n = Math.floor(relAbsoluteDensity*(properties.point_count)*maxRadius);
                    } else {
                        n = Math.floor(relAbsoluteDensity*(properties.point_count)*maxRadius);
                    }
            

                    if (n > maxRadius) {
                        n = maxRadius;
                        if (zoom < 5) {
                            n = zRangeMin/4 * n;
                        }
                    } else if (n < 1) {
                        n = Math.floor(relAbsoluteDensity*(properties.point_count+(zoom/zRangeDiff))*maxRadius);
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

var trackExampler = 0;
var recencyTileOptions = {
    rendererFactory: L.canvas.tile,
    vectorTileLayerStyles: {

        'catTrack': function(properties, zoom) {

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
    // interactive: true, // Make sure that this VectorGrid fires mouse/pointer events
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

    var v = L.vectorGrid;
    pbfLayer = v.protobuf(url, opts)
    pbfLayer.addTo(map) // It would be nice if this could handle the zipper data instead of unxip on sever
        .on('load', function (e) {
            // console.log('load', e);
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
    }
    $('.layer-button').css("border", "none");
    $('.layer-button').css("border-radius", "0 0 0 0");
    $('button#'+name+'-layer').css("border-left", "8px solid rgba(65, 123, 229, 0.36)");
    $('button#'+name+'-layer').css("border-radius", "4px 0px 0px 4px");
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
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
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
    if (z) {
        zoom = +(z) // cast to float
    }
    if (y) {
        center[1] = +(y)
    }
    if (x) {
        center[0] = +(x)
    }

    console.log("putUrlToView", center, zoom);
    map.setView(center,zoom);
    if (tile && tile !== "") {
        delegateTileLayer(tile);
    } else {
        delegateTileLayer("tile-light");
    }
    if (layer) {
        delegateDrawLayer(layer)
    } else {
        delegateDrawLayer(drawnLayer);
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
        // {"KeyN":3441161,"LastUpdatedAt":"2018-04-20T11:05:28.194001962-07:00","LastUpdatedBy":"Bigger Papa","LastUpdatedPointsN":84}
        // $("#metadata").text(data["KeyN"] + " points | " 
        // $("#metadata").text(JSON.stringify(data));
        var obj = $("#metadata");
        obj.text(numberWithCommas(data["KeyN"]) + " points.\n" 
            + "TileDB last updated " + moment(data["TileDBLastUpdated"]).fromNow() 
            // next updated is 4 hours from last updated
            + "; next update " + moment().to(moment(data["TileDBLastUpdated"]).add(4, 'hours')) + ".");
        obj.html(obj.html().replace(/\n/g,'<br/>'));
        if (jl_names.indexOf(data["LastUpdatedBy"]) >= 0) {
            $("#metadata-holder").css("border-left", "8px solid " + color_jl);
        } else if (ia_names.indexOf(data["LastUpdatedBy"]) >= 0) {
            $("#metadata-holder").css("border-left", "8px solid " + color_ia);
        }
    }
    });

    setTimeout(getAndMakeButtonsForLastKnownCats, 1000*60); // re-call again in a minute
}

var catIcon = L.icon({
    iconUrl: 'cat-icon.png',
    // shadowUrl: 'leaf-shadow.png',

    iconSize:     [32, 32], // size of the icon
    // shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [16, 16], // point of the icon which will correspond to marker's location
    // shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor:  [0, -8] // point from which the popup should open relative to the iconAnchor
});
var catIconSmall = L.icon({
    iconUrl: 'cat-icon.png',
    // shadowUrl: 'leaf-shadow.png',

    iconSize:     [16, 16], // size of the icon
    // shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [8, 8], // point of the icon which will correspond to marker's location
    // shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor:  [0, -4] // point from which the popup should open relative to the iconAnchor
});
var onMapMarkers = [];
function getAndMakeButtonsForLastKnownCats() {
    $.ajax({ 
        type: 'GET',
        url: lastKnownJSONurl,
        dataType: 'json', 
        success: function(data) { 

            $("#lastknowns").html("<small>Last known locations:</small>");

            // in case any existing already, remove em
            for (var i = 0; i < onMapMarkers.length; i++) {
                var cat = onMapMarkers[i];
                // cat.setIcon(catIconSmall);
                // cat.setOpacity(1/i);
                map.removeLayer(cat);
            }
            onMapMarkers = [];

            // console.log(data);
            $.each( data, function( key, val ) {
                // console.log("key", key, "val", val);
                // ignore the old ones
                if (moment(val["time"]).add(1, 'weeks').isBefore(moment())) {
                    return;
                }

                var button = $( "<button id='" + key + "' class='lastknownlink'> " + val["name"] + ", " + moment(val["time"]).fromNow() + "</button>" );
                button.data("lat", val["lat"]+"");
                button.data("long", val["long"]+"");
                button.css("z-index", 10000);

                var c = "#21DBEB";
                if (colors.hasOwnProperty(val["name"])) {
                    c = colors[val["name"]];
                    button.css("background-color", c);
                    // c = shadeRGBColor(c, 0.5);
                    button.css("color", "white");
                }
                $("#lastknowns").append(button);

                var l = L.marker([+val["lat"], +val["long"]], {icon: catIcon});
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

                $(document).on('click', '.lastknownlink', function(e){
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

$(function () {
    // var hh = $("#url-location-holder").height();
    // console.log("hh", hh);
    // var h =  hh + $("#metadata-holder").height() + 30 + "px";
    
    var h = $("#metadata-holder")[0].getBoundingClientRect();
    var hh = h.bottom;
    // console.log(h, hh);
    $("#layer-buttons").css("top", h + "px");
});


$("#goview").change(function(){
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

document.getElementById("recent-layer").onclick = function() {
    delegateDrawLayer("recent");
    putViewToUrl(buildViewUrl());
};
document.getElementById("speed-layer").onclick = function() {
    delegateDrawLayer("speed");
    putViewToUrl(buildViewUrl());
};
document.getElementById("density-layer").onclick = function() {
    delegateDrawLayer("density");
    putViewToUrl(buildViewUrl());
};
document.getElementById("trip-layer").onclick = function() {
    delegateDrawLayer("trip");
    putViewToUrl(buildViewUrl());
};
document.getElementById("url-location").onclick = function() {
    window.location.href = encodeURI(buildViewUrl());
}

