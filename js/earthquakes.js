var map;

/*function Earthquake(starttime = null,   endtime = null,
                    minmagnitude = null, maxmagnitude = null,
                    minlatitude = null, minlongitude = null,
                    maxlatitude = null, maxlongitude = null,
                    latitude = null,    longitude = null,
                    maxradius = null,   maxradiuskm = null) {
    //Savoir quelle type de zone est definie
    var zoneCarre = minlatitude || minlongitude || maxlatitude || maxlongitude;
    var zoneCirculaire = maxradius || maxradiuskm;

    if (zoneCirculaire) {
        if (maxradius && maxradiuskm) {
            throw "maxradius et maxradiuskm ne peuvent pas etre specifiés tous les deux.";
        }
        if (!latitude || !longitude) {
            throw "Il faut specifier la latitude et la longitude pour une zone circulaire.";
        }
    }

    if (starttime)      this.starttime      = starttime;
    if (endtime)        this.endtime        = endtime;
    if (minmagnitude)   this.minmagnitude   = minmagnitude;
    if (maxmagnitude)   this.maxmagnitude   = maxmagnitude;
    if (minlatitude)    this.minlatitude    = minlatitude;
    if (minlongitude)   this.minlongitude   = minlongitude;
    if (maxlatitude)    this.maxlatitude    = maxlatitude;
    if (maxlongitude)   this.maxlongitude   = maxlongitude;
    if (maxradius)      this.maxradius      = maxradius;
    if (maxradiuskm)    this.maxradiuskm    = maxradiuskm;
}*/

/** Recupere le marqueur (cercle) correspondant a un seisme
 * @param earthquake Le seisme a marquer
 * @return Le marqueur correspondant
 */
function circleMagnitude(earthquake) {
    console.log("Circle magnitude");
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

function putEarthquake(place) {
    var bounds = new google.maps.LatLngBounds();

    if (!place.geometry) return;
    if (place.geometry.viewport)
        bounds.union(place.geometry.viewport);
    else
        bounds.extend(place.geometry.location);
    map.fitBounds(bounds);

    // TODO : A retirer, juste pour marquer les points que l'on a cherches
    var mark = new google.maps.Marker(
        {
            position:{  lat:place.geometry.location.lat(),
                        lng:place.geometry.location.lng()
                    },
            map:map
        }
    );

    var eq = {
        //starttime   : ,
        //endtime     : ,
        //minmagnitude: ,
        //maxmagnitude: ,
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
        //minlatitude : ,
        //minlongitude: ,
        //maxlatitude : ,
        //maxlongitude: ,
        //maxradius   : ,
        maxradiuskm : 3000
    };
    loadEarthquakeLayerBis(eq);
    console.log(place.geometry.location.lat() + " " + place.geometry.location.lng()); // TODO: Utiliser la localisation pour formuler la requete
}


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

    //map.addListener('bounds_changed', () => { searchBox.setBounds(map.getBounds()); });

    function earthquakeResearchButton(location) {
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({'address':location}, function (data, status) {
            putEarthquake(data[0]);
        });
    }

    function earthquakeResearch() {
        var place = searchBox.getPlaces()[0];
        console.log("input = " + input.value);
        console.log("searchBox = " + searchBox);
        console.log("place = " + place);

        if (place) {
            if(place.types.includes('country'))
                loadCountryPeople(place.formatted_address, 10);
            putEarthquake(place);
        }
    }

    searchBox.addListener('places_changed', earthquakeResearch);

    document.getElementById('searchButton').onclick = () => {
        var location = input.value;
        console.log(location);
        earthquakeResearchButton(location);
    };

    /******* Recherche avancee *******/
    var advancedSearchButton = document.getElementById('advancedSearchButton');
    advancedSearchButton.onclick = () => {
        var eq = {
            starttime   : document.getElementById("starttime").value,
            endtime     : document.getElementById("endtime").value,
            minmagnitude: strToFloat(document.getElementById("minmagnitude").value),
            maxmagnitude: strToFloat(document.getElementById("maxmagnitude").value),
        }

        var circleEnable = !document.getElementById("latitude").disabled;
        var rectEnable = !document.getElementById("minlatitude").disabled;

        if (circleEnable && rectEnable) {
            throw "Selections des deux facons de rechercher."
        }
        else if (circleEnable) {
            eq.latitude = strToFloat(document.getElementById("latitude").value);
            eq.longitude = strToFloat(document.getElementById("longitude").value);
            eq.maxradiuskm = strToFloat(document.getElementById("maxradiuskm").value);
        }
        else if (rectEnable) {
            eq.minlatitude = strToFloat(document.getElementById("minlatitude").value);
            eq.minlongitude = strToFloat(document.getElementById("minlongitude").value);
            eq.maxlatitude = strToFloat(document.getElementById("maxlatitude").value);
            eq.maxlongitude = strToFloat(document.getElementById("maxlongitude").value);
        }
        var limit = strToInt(document.getElementById("limit").value);

        console.log(eq);
        limit == null ? loadEarthquakeLayerBis(eq) : loadEarthquakeLayerBis(eq, limit);  
    }

    /******* Seismes *******/

    //loadEarthquakeLayer(null, null, 3.5, null, 46.227638, 2.213749, 1000);

    map.data.setStyle(circleMagnitude);

    var infoWindow = new google.maps.InfoWindow();

    map.data.addListener('click', (event) =>    {
                                                    infoWindow.setPosition(event.feature.getGeometry().get());
                                                    infoWindow.setContent(getContent(event.feature));
                                                    infoWindow.open(map);
                                                    map.setCenter(event.feature.getGeometry().get());
                                                    if(map.getZoom() < 5)
                                                        map.setZoom(5);
                                                });

    map.addListener('click', () => {
                                        infoWindow.close();
                                        //map.setZoom(2);
                                    });
}



/** Charge et affiche sur la carte les seismes correspondant au criteres suivants
 * @param start Date de debut de la requete
 * @param end   Date de fin de la requete
 * @param min   Magnitude minimum du seisme
 * @param max   Magnitude maximum du seisme
 * @param lat   Latitude de recherche des seismes
 * @param lng   Longitude de recherche des seismes
 * @param rad   Rayon de recherche autour de la position donnee
 * @param limit Nombre maximum de seismes a afficher
 */
function loadEarthquakeLayer(start = null, end = null, min = null, max = null, lat = null, lng = null, rad = null, limit = 100) {
    var query = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&jsonerror=true';
    query += '&limit=' + limit;
    if (start && end) //(start || end)
        query += '&starttime=' + start + '&endtime=' + end;
    if (min || max)
        query += '&minmagnitude=' + min + '&maxmagnitude=' + max;
    if (lat && lng) //(lat || lng)
        query += '&latitude=' + lat + '&longitude='+ lng;
    if (lat && lng && rad)
        query += '&maxradiuskm=' + rad;

    map.data.loadGeoJson(query);

    console.log(query);
}

function loadEarthquakeLayerBis(eq, limit = 100) {
    eraseEarthquakeLayer();

    var zoneCarre = eq.minlatitude || eq.minlongitude || eq.maxlatitude || eq.maxlongitude;
    var zoneCirculaire = eq.maxradius || eq.maxradiuskm;

    if (zoneCirculaire && zoneCarre)
        throw "Des parametres de definition a la fois d'une zone circulaire et d'une zone carree sont definis.";

    if (zoneCirculaire) {
        if (eq.maxradius && eq.maxradiuskm) {
            throw "maxradius et maxradiuskm ne peuvent pas etre specifies tous les deux.";
        }
        if (!eq.latitude || !eq.longitude) {
            throw "Il faut specifier la latitude et la longitude pour une zone circulaire.";
        }
    }

    var query = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&jsonerror=true';
    query += '&limit=' + limit;

    for (let key in eq) {
        console.log(key);
        if (eq[key] != null) query += '&' + key + '=' + eq[key];
    }

    map.data.loadGeoJson(query);

    console.log(query);
}


/** Efface les seismes affiches sur la carte
 */
function eraseEarthquakeLayer() {
    map.data.forEach(earthquake => {map.data.remove(earthquake);});
}




/** Recupere les informations sur un seisme et les renvoit sous sorme d'une chaine de caracteres
 * @param earthquake Le seisme dont on veut recuperer les informations
 * @return Les informations connues sur le seisme
 */
function getContent(earthquake) {
    return '<span style="color:red">' + earthquake.getProperty('place') + '</span></br>'
         + 'Date: ' + parseDate2(earthquake.getProperty('time')) + '</br>'
         + 'Magnitude: ' + earthquake.getProperty('mag') + '</br>'
         + '<a href="' + earthquake.getProperty('url') + '" target="_blank">Details</a>';
}


/** Transforme un nombre de secondes depuis le 01-01-1970 00:00:00 en une date au format UTC
 * @param date Un nombre de secondes
 * @return La date correspondante au format UTC
 */
function parseDate2(date) {
    console.log(date);
    var temps = new Date();
    temps.setTime(date);
    console.log(temps.toUTCString());
    return temps.toUTCString();
}


function strToInt(num) {
    if (num.length == 0) return null;
    else return parseInt(num);
}

function strToFloat(num) {
    if (num.length == 0) return null;
    else return parseFloat(num);
}
