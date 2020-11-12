
<!DOCTYPE html>
<html>
  <head>
    <title>Spindrift Accident</title>
    <meta name="viewport" content="initial-scale=1.0, user-scalable=no">
    <meta charset="utf-8">
    <style>
      html, body, #map-canvas {
        height: 100%;
        margin: 0px;
        padding: 0px
      }
    </style>
    <script src="https://maps.googleapis.com/maps/api/js?v=3.exp"></script>
	<link rel="stylesheet" href="http://webapiv2.navionics.com/dist/webapi/webapi.min.css" >
	<script type="text/javascript" src="http://webapiv2.navionics.com/dist/webapi/webapi.min.no-dep.js"></script>
    <script>
var map;
function initialize() {
  map = new google.maps.Map(document.getElementById('map-canvas'), {
    zoom: 8,
    center: {lat: 47.71725, lng: -3.513783333},
	mapTypeControlOptions: {
	mapTypeIds: [
				JNC.Views.gNavionicsOverlay.CHARTS.NAUTICAL,
				google.maps.MapTypeId.ROADMAP, 
				google.maps.MapTypeId.SATELLITE]},
	mapTypeId: JNC.Views.gNavionicsOverlay.CHARTS.NAUTICAL
  });
  var navionicsNauticalChartOverlay = new JNC.Views.gNavionicsOverlay({
	navKey: "Navionics_webapi_00583",
			chartType: JNC.Views.gNavionicsOverlay.CHARTS.NAUTICAL,
			isTransparent: false
			});
			map.mapTypes.set(JNC.Views.gNavionicsOverlay.CHARTS.NAUTICAL, navionicsNauticalChartOverlay);
<?php
			if(isset($_GET['kml']) && !empty($_GET['kml'])){
			$kml = $_GET['kml'];

			$target_dir = "uploads/";
			$target_file = $target_dir . $kml.".kml";
			$target_url = "http://volodiaja.net/SailR/".$target_file;
			if (file_exists($target_file)) {
				echo "var kmlLayer = new google.maps.KmlLayer({url: '".$target_url."'})\n";
				echo "kmlLayer.setMap(map);";
				
				}
			}
?>
}

google.maps.event.addDomListener(window, 'load', initialize);


  
    </script>
  </head>
  <body>
    <div id="map-canvas"></div>
  </body>
</html>