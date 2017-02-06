# Tile Server
This application will serve MBTiles from a file named tiles.mbtiles. The route is http://localhost:8080/dbname/z/x/y

The HTML is a leaflet map that that loads tiles from http://localhost:8080/tiles/{z}/{x}/{y}

This project can be modified to server multiple tile layer if you copy the handler and assign it to another route making some small changes (dbname for starters). 
