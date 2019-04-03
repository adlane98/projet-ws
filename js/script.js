var map;


/** Initialise la carte et ajoute les gestionnaires d'evenements
 */
function mapInitialisation() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 3,
        minZoom: 2,
        restriction: {
            latLngBounds: {
                    north: 85,
                    south: -85,
                    west: -180,
                    east: 180,
                },
            strictBounds: false},
        center: {lat: 30, lng: 0},
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

        if (place) {
            if(place.types.includes('country'))
                loadCountryPeople(place.formatted_address, 10);

            var bounds = new google.maps.LatLngBounds();

            if (!place.geometry) return;
            if (place.geometry.viewport)
                bounds.union(place.geometry.viewport);
            else
                bounds.extend(place.geometry.location);
            map.fitBounds(bounds);

            console.log(place.geometry.location.lat() + " " + place.geometry.location.lng()); // TODO: Utiliser la localisation pour formuler la requete
        }
    });

    /******* Seismes *******/
    map.data.setStyle(circleMagnitude);

    var infoWindow = new google.maps.InfoWindow();

    map.data.addListener('click', function(event) {
                                                        infoWindow.setPosition(event.feature.getGeometry().get());
                                                        infoWindow.setContent(getContent(event.feature));
                                                        infoWindow.open(map);
                                                        map.setCenter(event.feature.getGeometry().get());
                                                        if(map.getZoom()<5)
                                                            map.setZoom(5);
                                                  });

    map.addListener('click', function() {
                                            infoWindow.close();
                                            map.setZoom(2);
                                        });
}



/** Charge et affiche sur la carte les seismes correspondant au criteres suivants
 * @param start Date de debut de la requete
 * @param end   Date de fin de la requete
 * @param min   Magnitude minimum du seisme
 * @param max   Magnitude minimum du seisme
 * @param lat   Latitude de recherche des seismes
 * @param lng   Longitude de recherche des seismes
 * @param rad   Rayon de recherche autour de la position donnee
 * @param limit Nombre maximum de seismes a afficher
 */
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


/** Efface les seismes affiches sur la carte
 */
function eraseEarthquakeLayer() {
    map.data.forEach(function(earthquake){map.data.remove(earthquake);});
}


/** Recupere le marqueur (cercle) correspondant a un seisme
 * @param earthquake Le seisme a marquer
 * @return Le marqueur correspondant
 */
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
        title: earthquake.getProperty('title'),
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


/** Recupere les informations sur un seisme et les renvoit sous sorme d'une chaine de caracteres
 * @param earthquake Le seisme dont on veut recuperer les informations
 * @return Les informations connues sur le seisme
 */
function getContent(earthquake) {
    return '<span style="color:red">' + earthquake.getProperty('place') + '</span></br>'
         + 'Date: ' + parseDate(earthquake.getProperty('time')) + '</br>'
         + 'Magnitude: ' + earthquake.getProperty('mag') + '</br>'
         + '<a href="' + earthquake.getProperty('url') + '" target="_blank">Details</a>';
}


/** Transforme un nombre de secondes depuis le 01-01-1970 00:00:00 en une date au format UTC
 * @param date Un nombre de secondes
 * @return La date correspondante au format UTC
 */
function parseDate(date) {
    var temps = new Date();
    temps.setTime(date);
    return temps.toUTCString();
}


function loadCountryPeople(country, nb = 100) {
    var query = 'PREFIX dbpedia-owl: <http://dbpedia.org/ontology/>'
              + 'PREFIX dbpedia: <http://dbpedia.org/resource/>'
              + 'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>'
              + 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>'
              + 'SELECT DISTINCT ?name ?desc WHERE {'
              +     'Optional{'
              +         '?person dbpedia-owl:birthPlace ?country .'
              +     '}'
              +     'Optional{'
              +         '?person dbpedia-owl:birthPlace ?place .'
              +         '?place dbpedia-owl:country ?country .'
              +     '}'
              +     '?person a dbpedia-owl:Person ;'
              +             'rdfs:comment ?desc ;'
              +             'rdfs:label ?name .'
              +     '?country a dbpedia-owl:Country ;'
              +              'rdfs:label ?countryName .'
              +     "FILTER(LANG(?name)='en' && LANG(?desc)='en' && regex(?countryName, '^" + country + "', 'i')) ."
              + '} LIMIT ' + nb;

    var request = 'http://dbpedia.org/sparql?default-graph-uri=&query='
                + encodeURIComponent(query).replace(/'/g,"%27").replace(/"/g,"%22")
                + '&format=application%2Fsparql-results%2Bjson';

    var xhr = new XMLHttpRequest();
    xhr.open("GET", request, true);
    xhr.send(null);
    xhr.addEventListener("load", function() {
                                                var results;
                                                try{results = JSON.parse(this.responseText).results.bindings;}
                                                catch{}
                                                console.log(results); // TODO: traiter les resultats de la requete
                                            });
}

/**
 */
function loadVideos() {
    return 'https://developers.google.com/apis-explorer/#p/youtube/v3/youtube.search.list?part=snippet&key=AIzaSyCvM8ENjaBYUOERtQEhlcfFGOxF8T248CE&type=video&order=viewCount&q=skateboarding+dog';
}
