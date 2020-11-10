<!DOCTYPE HTML>
<html lang="en">
  <head>
    <meta charset="utf-8" />
	<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/leaflet.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/leaflet.css" />
	<link rel="stylesheet" href="https://webapiv2.navionics.com/dist/webapi/webapi.min.css" >
	<script type="text/javascript" src="https://webapiv2.navionics.com/dist/webapi/webapi.min.no-dep.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet-gpx/1.4.0/gpx.min.js"></script>
	<script src='https://api.tiles.mapbox.com/mapbox.js/plugins/leaflet-omnivore/v0.3.1/leaflet-omnivore.min.js'></script>
    <!--leaflet-velocity-->
	<link rel="stylesheet" href="include/leaflet-velocity.css" />
	<script src="include/leaflet-velocity.js"></script>
	<script src="include/IE_workarounds.js"></script>
	<!--for timeslider-->
	<script type="text/javascript" src="include/iso8601.min.js"></script>
	<script type="text/javascript" src="include/leaflet.timedimension.noLayers.src.js"></script>
	<link rel="stylesheet" href="include/leaflet.timedimension.control.min.css" />

	<!--load variable values from server-->
	<script type="text/javascript" src="https://weather.openportguide.org/weather/javascript_vars.js"></script>
	<script type="text/javascript" src="https://weather.openportguide.org/weather/javascript_vars_rtofs.js"></script>
	<script type="text/javascript" src="include/rotatedmarker.js"></script>
	<!-- add Polyline -->
	<link rel="stylesheet" href="https://ppete2.github.io/Leaflet.PolylineMeasure/Leaflet.PolylineMeasure.css" />
	<script src="https://ppete2.github.io/Leaflet.PolylineMeasure/Leaflet.PolylineMeasure.js"></script>
	
	<style>
      html, body {
        height: 100%;
        padding: 0;
        margin: 0;
      }
      #map {
        /* configure the size of the map */
        width: 100%;
        height: 100%;
      }
	  #switch{
			
			background: rgba(51,97,95,0.7);
			z-index: 1000;
			position: absolute;
			color: white;
			padding: 10px;
			border-radius: 10px;
			-moz-border-radius: 10px;
			-o-border-radius: 10px;
			-webkit-border-radius: 10px;
			-ms-border-radius: 10px;
		}
				.menudiv{
		display: none;
		font-family: Georgia, serif;
		}
		#wxtiles_attrib{
		display: none;
		}
		#utctime{
		display: none;
		font-family: Georgia, serif;
		}
		#RTFM{
		display:none;
		font-family: Georgia, serif;
		}

		.menubutton{
		
		display: none;
		font-family: Georgia, serif;
		}
		a{
			color: white;
		}
      }
		</style>
  </head>
  <body>
   
		<div id="switch">
		<a href="#" id="sl"><img src="img/list90.png"></a>
		<a href="#" class="arrowW" id="pw" style="display: none;"><img src="img/arrow7.png" alt="<"></a>
		<a href="#" class="arrowW" id="nw" style="display: none;"><img src="img/arrow487.png" alt=">"></a>

		<a href="#" class="menubutton" id="sto"><img src="img/three115.png" alt="tools"></a>
		<a href="#" class="menubutton" id="su"><img id="imgsu" src="img/upload.png" alt="upload"></a>
		<a href="#" class="menubutton" id="si"><img src="img/info30.png" alt="info"></a>
		<a href="#" class="menubutton" id="sp"><img src="img/cursor.png" alt="Position"></a>
		<br/>
	
		<div class="menudiv" id ="tools">
			<a href="#" id="sd"><img src="img/ruler24.png" alt="ruler"></a>
			<a href="#" id="sg"><img src="img/earth186.png" alt="grid"></a>

		</div>
	

	<div class="menudiv" id="upload">
	<form action="upload.php" method="post" enctype="multipart/form-data">
    Select GPX/KML file to upload:
    <input type="file" name="fileToUpload" id="fileToUpload">
    <input type="submit" value="Upload GPX/KML" name="submit">
	
	</form>
	<div class="printarea"></div>
	</div>
	<div style="display:none;" id="stats">
	</div>
	<div class="menudiv" id="about">
			
				<p style="display: block; margin: 0 auto;">
						Weather Data : <a href="http://www.openportguide.org/" target="_blank" >OpenPortGuide</a><br />
						Maps Data : <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap </a> and <a href="http://www.navionics.com/" target="_blank">Navionics</a><br />
						Icons : <a href="http://www.flaticon.com" target="_blank">FlatIcon</a><br />
						<a href="http://twitter.com/volodia" target="_blank">(C) Volodia</a>
						<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
							<input type="hidden" name="cmd" value="_s-xclick">
							<input type="hidden" name="hosted_button_id" value="27J6QTCBZ24AU">
							<input style="display: block; margin: 0 auto;" type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif" border="0" name="submit"  alt="PayPal - The safer, easier way to pay online!">
							<img alt="" border="0" src="https://www.paypalobjects.com/fr_FR/i/scr/pixel.gif" width="1" height="1">
						</form>
						
					</p>		
	</div>	
	</div>
	 <div id="map"></div>
	 
    <script>
    var startTime = new Date(Date.UTC(GFS_server_year, GFS_server_month - 1, GFS_server_day, GFS_server_hour));
	var actualTime = new Date(Date.UTC(GFS_server_year, GFS_server_month - 1, GFS_server_day, GFS_server_hour + 6)); //actual time is about 6 hours ahead to the first forecast timestep
	var endTime = new Date(Date.UTC(GFS_server_year, GFS_server_month - 1, GFS_server_day, GFS_server_hour + ((GFS_timesteps-1)*GFS_interval)));
	var dataTimeInterval = startTime.toISOString() + "/" + endTime.toISOString();
	var actualInterval = GFS_interval*2 ; // show only every second available timestep (GFS_interval is "3" hours
	var baseIndex = 1; // index of the wind10mArray containing the layer nearest to the actual time (2 if actualIndex==GFS_Index, 1 if actualIndex==GFS_Index*2)
	var dataPeriod = "PT" + (actualInterval) + "H";
	var wind10mBaseURL = 'https://weather.openportguide.org/weather/wind10m/';
	var wind10mBaseName = 'wind10m_{h}h';
	var wind10mName = '';
	var wind10mArray = [];


	var startTimeRTOFS = new Date(Date.UTC(RTOFS_server_year, RTOFS_server_month - 1, RTOFS_server_day, RTOFS_server_hour));
	var actualTimeRTOFS = new Date(Date.UTC(RTOFS_server_year, RTOFS_server_month - 1, RTOFS_server_day, RTOFS_server_hour + 6));
	var endTimeRTOFS = new Date(Date.UTC(RTOFS_server_year, RTOFS_server_month - 1, RTOFS_server_day, RTOFS_server_hour + ((RTOFS_timesteps-1)*RTOFS_interval)));
	var dataTimeIntervalRTOFS = startTimeRTOFS.toISOString() + "/" + endTimeRTOFS.toISOString();
	var actualIntervalRTOFS = RTOFS_interval*2 ; // show only every second available timestep
	var baseIndexRTOFS = 1; // index of the seaSurfaceCurrent Array containing the layer nearest to the actual time (2 if actualIndex==RTOFS_Index, 1 if actualIndex==RTOFS_Index*2)
	var dataPeriodRTOFS = "PT" + (actualIntervalRTOFS) + "H";
	var seaSurfaceCurrentBaseURL = 'weather/sea_surface_current/';
	var seaSurfaceCurrentBaseName = 'sea_surface_current_{h}h';
	var seaSurfaceCurrentName = '';
	var seaSurfaceCurrentArray = [];
	  
	  // initialize Leaflet
	    
      var map = L.map('map',{ zoomControl: false, timeDimension: true,
			timeDimensionOptions: {
			timeInterval: dataTimeInterval,
			period: dataPeriod,
			currentTime: actualTime
			},
			timeDimensionControl: true,
			timeDimensionControlOptions: {
			position: "topright",
			loopButton: false,
			limitSliders: false,
			playButton: false,
			speedSlider: false
			} }).setView({lon: 0, lat: 0}, 2);

      // add the OpenStreetMap tiles
      var osm=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
      });
	  L.control.zoom({
    position: 'topright'
}).addTo(map);
	var optionspoly = {position: 'topright',unit: 'nauticalmiles', showClearControl: true,showBearings: true};
	L.control.polylineMeasure(optionspoly).addTo(map);
	var overlay=new JNC.Leaflet.NavionicsOverlay({
    navKey: 'Navionics_webapi_00583',
    chartType: JNC.NAVIONICS_CHARTS.NAUTICAL,
    isTransparent: false,
    // Enable Navionics logo without payoff (default behaviour)
    logoPayoff: false,
    zIndex: 1
	});
	overlay.addTo(map);
	overlayPane = {
	  "Navionics" : overlay,
	  "OSM" : osm,
	};
layerControl = L.control.layers(null, overlayPane, {position: 'topright'});
layerControl.addTo(map);

var wind10mLayerGroup = new L.layerGroup([], {});
wind10mArray.length = map.timeDimension._availableTimes.length;

var actualTimeIndex = map.timeDimension._currentTimeIndex;

// load data (u, v grids) from weather.openportguide.de
layerControl.addOverlay(wind10mLayerGroup, 'wind10m');
updateLayer(wind10mArray[actualTimeIndex]);

window.setInterval(function() { //check if time index changed
if (actualTimeIndex != map.timeDimension._currentTimeIndex) {
actualTimeIndex = map.timeDimension._currentTimeIndex;
updateLayer(wind10mArray[actualTimeIndex]);
}
},100);

function updateLayer(Layer){ //updates the actual layer
wind10mLayerGroup.clearLayers();
wind10mName = wind10mBaseName.replace(/{h}/g, (actualTimeIndex - baseIndex) * actualInterval);

$.getJSON(wind10mBaseURL + wind10mName + ".json", function (data) {
this[wind10mName] = L.velocityLayer({
displayValues: true,
displayOptions: {
velocityType: "Wind",
emptyString: "No wind data",
angleConvention: "MeteoCW",
speedUnit: "kt"
},
data: data,
minVelocity: 0,
maxVelocity: 30,
velocityScale: 0.008,
particleAge: 90,
lineWidth: 3,
particleMultiplier: 0.0033,
frameRate: 15,
colorScale: ["#2468b4", "#3c9dc2", "#80cdc1", "#97daa8", "#c6e7b5", "#eef7d9", "#ffee9f", "#fcd97d", "#ffb664", "#fc964b", "#fa7034", "#f54020", "#ed2d1c", "#dc1820", "#b40023"]
});

wind10mLayerGroup.addLayer(this[wind10mName]);
wind10mArray[actualTimeIndex] = wind10mLayerGroup.getLayer(wind10mLayerGroup.getLayerId(this[wind10mName]));
wind10mLayerGroup.addTo(map);
});
} 
		

      // show a track on the map
     	<?php
			if(isset($_GET['gpx']) && !empty($_GET['gpx'])){
			$gpx = $_GET['gpx'];

			$target_dir = "uploads/";
			$target_file = $target_dir . $gpx.".gpx";
			$target_url = "https://volodiaja.net/SailR/".$target_file;
			if (file_exists($target_file)) {
				echo "var gpx = '".$target_url."'; \n";
				echo "new L.GPX(gpx, {async: true}).on('loaded', function(e) {map.fitBounds(e.target.getBounds());
				$('#stats').html('Length: '+ (e.target.get_distance()/1852).toFixed(1)+' nm<br>Speed: '+(e.target.get_moving_speed()/1.852).toFixed(1)+' kts');
				
				
				}).addTo(map);";

				$html = "Share your Map ! : <br /><a href=\'".$_SERVER['REQUEST_URI']."\' >Direct link</a><br />Embed<br /><textarea name=\'textarea\' style=\'width:250px;height:100px;\'><iframe src=\'http://volodiaja.net/SailR/embed.php?gpx=".$gpx."\' width=\'500\' height=\'300\'></iframe></textarea><br /><a href=\'https://twitter.com/share\' class=\'twitter-share-button\' data-via=\'_SailR_\' data-count=\'none\' data-hashtags=\'SailR\'>Tweet</a>";
				echo "$('#upload').html('".$html."');\n";
				echo "$('#imgsu').attr('src', 'img/network.png');";
	
				echo "$('#stats').fadeIn();\n";
				
				}
			}
		?>

		  <?php
			if(isset($_GET['kml']) && !empty($_GET['kml'])){
			$kml = $_GET['kml'];

			$target_dir = "uploads/";
			$target_file = $target_dir . $kml.".kml";
			$target_url = "https://volodiaja.net/SailR/".$target_file;
			if (file_exists($target_file)) {
				echo "var runLayer = omnivore.kml('".$target_url."')
					.on('ready', function() {
					map.fitBounds(runLayer.getBounds());
					})
					.addTo(map);\n";
				
					

				$html = "Share your Map ! : <br /><a href=\'".$_SERVER['REQUEST_URI']."\' >Direct link</a><br />Embed<br /><textarea name=\'textarea\' style=\'width:250px;height:100px;\'><iframe src=\'http://volodiaja.net/SailR/embed.php?gpx=".$gpx."\' width=\'500\' height=\'300\'></iframe></textarea><br /><a href=\'https://twitter.com/share\' class=\'twitter-share-button\' data-via=\'_SailR_\' data-count=\'none\' data-hashtags=\'SailR\'>Tweet</a>";
				echo "$('#upload').html('".$html."');\n";
				echo "$('#imgsu').attr('src', 'img/network.png');";
				}
			}
		?>

		var watchID;
        var geoLoc;
        var DeviceMarker = L.marker(map.getCenter(), {
                rotationAngle: 0,
                draggable: true
            }) 
         function showLocation(position) {
            var latitude = position.coords.latitude;
            var longitude = position.coords.longitude;
            map.panTo(new L.LatLng(latitude, longitude));
			DeviceMarker.setLatLng(new L.LatLng(latitude, longitude));
			if(position.coords.heading!=null)
			{
			DeviceMarker.setRotationAngle(position.coords.heading);
			}
			$('#stats').html('Lat : '+position.coords.latitude
							+'<br/>Lon: '+position.coords.longitude
							+'<br/>Speed: '+position.coords.speed.toFixed(1)
							+'<br/>Heading: '+position.coords.heading.toFixed(0));
			$('#stats').fadeIn();
         }
         
         function errorHandler(err) {
            if(err.code == 1) {
               alert("Error: Access is denied!");
            } else if( err.code == 2) {
               alert("Error: Position is unavailable!");
            }
         }
         
         function getLocationUpdate(){
            
            if(navigator.geolocation){
               
               // timeout at 60000 milliseconds (60 seconds)
               var options = {enableHighAccuracy: true,timeout:60000};
               geoLoc = navigator.geolocation;
               watchID = geoLoc.watchPosition(showLocation, errorHandler, options);
            } else {
               alert("Sorry, browser does not support geolocation!");
            }
         }

$("#sp").click(function() {
	if(watchID===undefined)
	{
		getLocationUpdate();
		map.setZoom(9);
		DeviceMarker.addTo(map);
	}
	else
	{
		navigator.geolocation.clearWatch(watchID);
		watchID = (function () { return; })();
		map.removeLayer(DeviceMarker)
		$('#stats').html('');
		$('#stats').fadeOut();
	}

});

$("#sl").click(function(event){
				event.preventDefault(); 
				if($('.menubutton').is(":visible"))
				{
				$('.menubutton').fadeOut();
				$('.menudiv').fadeOut();
				$('#utctime').fadeOut();
				$('.arrowT').fadeOut();
				if($('.arrowW').is(":visible"))
				{
				$('#sw').fadeIn();
				}
				else
				{
				$('#sw').fadeOut();
				}
				
				}
				else
				{
				$('.menubutton').fadeIn();
				$('.arrowT').fadeIn();
				
				$('#sw').fadeIn();
				}
			});

$("#sto").click(function(event){
				event.preventDefault(); 
				if($('#tools').is(":visible"))
				{
				$('#tools').fadeOut();
				}
				else
				{
				$('.menudiv').hide();
				$('#tools').fadeIn();
				}
			});
$("#si").click(function(event){
				event.preventDefault(); 
				if($('#about').is(":visible"))
				{
				$('#about').fadeOut();
				}
				else
				{
				$('.menudiv').hide();
				$('#about').fadeIn();
				}
			});
			$("#su").click(function(event){
				event.preventDefault(); 
				if($('#upload').is(":visible"))
				{
				$('#upload').fadeOut();
				}
				else
				{
				$('.menudiv').hide();
				$('#upload').fadeIn();
				}
			});
    </script>
  </body>
</html>