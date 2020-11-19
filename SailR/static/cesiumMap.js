var viewer;
var boatsEntities = [];

function initMap(containerId){

    // Set 3D map
    viewer = new Cesium.Viewer(containerId, {
        // Remove default button
        animation:false,
        homeButton:false,
        sceneModePicker:false,
        navigationHelpButton:false,
        baseLayerPicker: false,
        navigationInstructionsInitiallyVisible: false,
        // Remove stars background
        skyBox:false,
        // Remove geocoder search
        geocoder:false,
        // Timeline
        timeline:true,
        // Switch to request render mode for performances reasons
        requestRenderMode:true
      });

}

function addBoatToMap(key,boat){
    // Billboard size
    var width = 40;
    var height = 60;

    // --- Container ---
    var positionProperty = new Cesium.SampledPositionProperty();
    var orientationProperty = new Cesium.SampledProperty(Number);

    // Build track points
    $.each( boat.classements, function( elemK, elemV ) {
        const date = Cesium.JulianDate.fromIso8601(elemV.Date);
        const position = Cesium.Cartesian3.fromDegrees(Number(elemV.longitude),Number(elemV.latitude),0.0);

        positionProperty.addSample(date, position);
        orientationProperty.addSample(date,Number(boat.cap));
    });

    // Get time frame
    const start = Cesium.JulianDate.fromIso8601(boat.classements[0].Date);
    const stop = Cesium.JulianDate.fromIso8601(boat.classements[boat.classements.length-1].Date);

    viewer.clock.startTime = start.clone();
    viewer.clock.stopTime = stop.clone();
    viewer.clock.currentTime = stop.clone();
    viewer.timeline.zoomTo(start, stop);

    // Entity
    var boatEntity = new Cesium.Entity({
        name:boat.bateau,
        availability:new Cesium.TimeIntervalCollection([ new Cesium.TimeInterval({ start: start, stop: stop }) ]),
        position:positionProperty,
        point:{
            pixelSize:10,
            color: Cesium.Color.fromCssColorString(boat.couleur)
        },
        billboard:{
            image:'static/img/markers/' + key + '.png',
            width:width/1.5, 
            height:height/1.5,
            rotation:-(boat.classements[boat.classements.length-1].cap/Cesium.Math.DEGREES_PER_RADIAN)
        },
        path: new Cesium.PathGraphics({
            width:2,
            resolution:3600,
            material:Cesium.Color.fromCssColorString(boat.couleur)
        })
    });

    viewer.entities.add(boatEntity);
}

function addZone(zonePoints,zoneName,flipCoords){
    // Points
    var ptsArray = [];
    //Inversion Lat/Lon
    $.each(zonePoints, function(index,value){
        if(flipCoords == true){
            ptsArray.push(value[1]);
            ptsArray.push(value[0]);
        }else{
            ptsArray.push(value[0]);
            ptsArray.push(value[1]);
        }
    });
    // Build polygon
    var dstZone = viewer.entities.add({
        name: zoneName,
        polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(ptsArray),
            material: new Cesium.StripeMaterialProperty({
                orientation:Cesium.StripeOrientation.VERTICAL,
                evenColor: Cesium.Color.RED.withAlpha(0.5),
                oddColor: Cesium.Color.WHITE.withAlpha(0.0),
                repeat: 360.0,
            })
        }
    });
}

function addPolyline(linePts,lineName){

    // map points
    const polylinePoints = [];
    $.each(linePts,function(index,value){
        //const position = Cesium.Cartesian3.fromDegrees(value[1],value[0],0.0);
        polylinePoints.push(value[1]);
        polylinePoints.push(value[0]);
    })

    var polylineEntity = new Cesium.Entity({
        name:lineName,
        polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray(polylinePoints),
            width: 0.5,
            material: Cesium.Color.WHITE
        }
    });

    viewer.entities.add(polylineEntity);
}