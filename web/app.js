var initialLat = 40.7831;
var initialLng = -73.9712;

// var map = L.map('map').setView([initialLat, initialLng], 16);
//
// // L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
// //     attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
// //     subdomains: 'abcd',
// //     // maxZoom: 19
// // }).addTo(map);
// //
// // L.tileLayer('../test/{z}/{x}/{y}.png', {
// //     // maxZoom: 19,
// //     // opacity: 0.8
// // }).addTo(map);


var osmTileJSON = {
    "tilejson": "2.0.0",
    "name": "OpenStreetMap",
    "description": "A free editable map of the whole world.",
    "version": "1.0.0",
    "attribution": "&copy; OpenStreetMap contributors, CC-BY-SA",
    "scheme": "xyz",
    "tiles": [
        "http://a.tile.openstreetmap.org/${z}/${x}/${y}.png",
        "http://b.tile.openstreetmap.org/${z}/${x}/${y}.png",
        "http://c.tile.openstreetmap.org/${z}/${x}/${y}.png"
    ],
    "minzoom": 0,
    "maxzoom": 18,
    "bounds": [ -180, -85, 180, 85 ],
    "center": [ 11.9, 57.7, 8 ]
};

var map = L.tilejson.createMap('map', osmTileJSON);