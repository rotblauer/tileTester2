var initialLat = 38.62;
var initialLng = -90.19;

var map = L.map('map').setView([initialLat, initialLng], 12);
//
L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd',
    // maxZoom: 19
}).addTo(map);

L.tileLayer('http://localhost:8080/test/{z}/{x}/{y}.png', {
    // maxZoom: 19,
    // opacity: 0.8
}).addTo(map);

// $.getJSON("../out.json",function(data){
//     // add GeoJSON layer to the map once the file is loaded
//     L.geoJson(data).addTo(map);
// });
//
// var osmTileJSON = {
//     "tilejson": "2.0.0",
//     "name": "OpenStreetMap",
//     "description": "A free editable map of the whole world.",
//     "version": "1.0.0",
//     "attribution": "&copy; OpenStreetMap contributors, CC-BY-SA",
//     "scheme": "xyz",
//     "tiles": [
//         "http://a.tile.openstreetmap.org/${z}/${x}/${y}.png",
//         "http://b.tile.openstreetmap.org/${z}/${x}/${y}.png",
//         "http://c.tile.openstreetmap.org/${z}/${x}/${y}.png"
//     ],
//     "minzoom": 0,
//     "maxzoom": 18,
//     "bounds": [ -180, -85, 180, 85 ],
//     "center": [ 11.9, 57.7, 8 ]
// };
//
// var map = L.TileJSON.createMap('map', osmTileJSON);