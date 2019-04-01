var map;

function mapInitialisation() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 2,
        minZoom: 2,
        restriction: {
            latLngBounds: {
                    north: 89.45016124669523,
                    south: -87.71179927260242,
                    west: -200,
                    east: 200,
                },
            strictBounds: true},
        center: {lat: 47, lng: 2.8},
        mapTypeId: 'terrain',
        disableDefaultUI: true
    });

    /******* Recherche *******/
    var input = document.getElementById('searchBox');
    var searchBox = new google.maps.places.SearchBox(input);

    map.addListener('bounds_changed', function() {
                                                    searchBox.setBounds(map.getBounds());
                                                 });

    searchBox.addListener('places_changed', function() {
        var place = searchBox.getPlaces()[0];
        var bounds = new google.maps.LatLngBounds();

        if (!place.geometry) return;

        if (place.geometry.viewport)
            bounds.union(place.geometry.viewport);
        else
            bounds.extend(place.geometry.location);
        map.fitBounds(bounds);

        console.log(place.geometry.location.lat() + " " + place.geometry.location.lng()); // TODO: Utiliser la localisation pour formuler la requete
    });

    /******* Seismes *******/
    map.data.setStyle(circleMagnitude);
    map.data.addListener('click', function(event) {
                                                        /* traiter les données du seisme */
                                                        console.log(event.feature.getProperty('mag'));
                                                  });
}

function loadEarthquakeLayer(start = null, end = null, min = null, max = null, lat = null, lng = null, rad = null, limit = 100) {
    var query = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&jsonerror=true';
    
    query += '&limit=' + limit;
    if (start || end)
        query += '&starttime=' + start + '&endtime=' + end;
    if (min || max)
        query += '&minmagnitude=' + min + '&maxmagnitude=' + max;
    if (lat || lng)
        query += '&latitude=' + lat + '&longitude='+ lng;
    if (lat && lon && rad)
        query += '&maxradiuskm' + rad;

    map.data.loadGeoJson(query);
}

function eraseEarthquakeLayer() {
    map.data.forEach(function(earthquake){map.data.remove(earthquake);});
}

function circleMagnitude(earthquake) {
    var color = [];

    var minMag = 1.0;
    var maxMag = 9.0;
    var currentMag = earthquake.getProperty('mag');

    var colorHSL = [[131, 100, 60], [28, 100, 50], [0, 100, 30]];
    var position = (Math.min(currentMag, maxMag) - minMag) / (maxMag - minMag);

    for (var i = 0; i < 3; i++)
        if (position <= 0.5)
            color[i] = (colorHSL[1][i] - colorHSL[0][i]) * (position*2) + colorHSL[0][i];
        else
            color[i] = (colorHSL[2][i] - colorHSL[1][i]) * ((position-0.5)*2) + colorHSL[1][i];

    return {
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            strokeWeight: 0.5,
            strokeColor: 'grey',
            fillColor: 'hsl(' + color[0] + ',' + color[1] + '%,' + color[2] + '%)',
            fillOpacity: 1 / currentMag,
            scale: 5 * currentMag
        },
        zIndex: Math.floor(currentMag)
    };
}
