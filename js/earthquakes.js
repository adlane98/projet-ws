var map;
var marker;

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

function putEarthquake(place) {
    /******* Recherche avancee *******/
    var eq = {
        starttime   : document.getElementById("starttime").value,
        endtime     : document.getElementById("endtime").value,
        minmagnitude: strToFloat(document.getElementById("minmagnitude").value),
        maxmagnitude: strToFloat(document.getElementById("maxmagnitude").value)
    };
    if (place) {
        var bounds = new google.maps.LatLngBounds();

        if (!place.geometry) return;
        if (place.geometry.viewport)
            bounds.union(place.geometry.viewport);
        else
            bounds.extend(place.geometry.location);
        map.fitBounds(bounds);

        if (marker) marker.setMap(null);
        marker = new google.maps.Marker(
            {
                position:{  lat:place.geometry.location.lat(),
                            lng:place.geometry.location.lng()
                        },
                map:map
            }
        );

        eq.latitude = place.geometry.location.lat();
        eq.longitude = place.geometry.location.lng();
        eq.maxradiuskm = strToFloat(document.getElementById("maxradiuskm").value);
    }

    var limit = strToInt(document.getElementById("limit").value);
    limit == null ? loadEarthquakeLayerBis(eq) : loadEarthquakeLayerBis(eq, limit);
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


    function earthquakeResearch() {
        var place = searchBox.getPlaces()[0];

        document.getElementById("peopleResultsZone").hidden = true;
        putEarthquake(place);

        if (place) {
            var searchInfoTitle = document.getElementById("searchInfoTitle");
            var searchInfoContents = document.getElementById("searchInfoContents");
            var videoLinksContents = document.getElementById("videoLinksContents");
            var peopleResultsContents = document.getElementById("peopleResultsContents");

            searchInfoTitle.innerHTML = "";
            searchInfoContents.innerHTML = "";
            videoLinksContents.innerHTML = "";
            peopleResultsContents.innerHTML = "";
            //Traduction du texte rentre en anglais
            var request = 'https://translation.googleapis.com/language/translate/v2?target=en&key='
                        + "AIzaSyCvM8ENjaBYUOERtQEhlcfFGOxF8T248CE"
                        + "&q="
                        + encodeURIComponent(input.value).replace(/'/g,"%27").replace(/"/g,"%22");
            var xhr = new XMLHttpRequest();
            xhr.open("GET", request, false);
            xhr.send(null);
            var keywords = input.value;
            try {
                keywords = JSON.parse(xhr.responseText).data.translations[0].translatedText
            } catch {
            }
            var lookUpDBpediaQuery = "http://lookup.dbpedia.org/api/search.asmx/KeywordSearch?&QueryString=" + keywords;
            var req = new XMLHttpRequest();
            req.open("GET", lookUpDBpediaQuery, false);
            req.send(null); // Quand il n'y a pas de resultats, la longueur du resultat est de 216
            var responseLen = req.responseText.length;
            if (responseLen <= 216) { // Si pas de resultats, on recupere le premier mot de l'input
                                        // Si input.value = "Saint-Ouen, France", on recupere "Saint-Ouen"
                var cleanInput = input.value.split(" ")[0];
                lookUpDBpediaQuery = "http://lookup.dbpedia.org/api/search.asmx/KeywordSearch?&QueryString=" + cleanInput;
                req = new XMLHttpRequest();
                req.open("GET", lookUpDBpediaQuery, false);
                req.send(null); // Quand il n'y a pas de resultats, la longueur du resultat est de 216
                if (req.responseText.length <= 216) {
                    console.log("Rien trouve pour ce lieu");
                    return; // On sort de la fonction si on a rien trouve TODO : Afficher "rien trouver" sur la page
                }
            }

            // On recupere l'URI
            var xmlparser = new DOMParser();
            var xmldoc = xmlparser.parseFromString(req.responseText, "text/xml");
            // On recherche le premier URI qui a comme type la classe "place". On determine si ce que l'on trouve est bien un lieu.
            var isplace = false;
            var results = xmldoc.getElementsByTagName("Result");
            var index = 0;
            for (i = 0; i < results.length && !isplace; i++) {
                var classes = results[i].children[3].children // On recupere les classes qui sont des types de l'URI recherchee "<Classes>" : indice 3
                if (classes.length == 0) isplace = true; // S'il n'y a rien dans les types alors on considere que c'est un lieu
                for (j = 0; j < classes.length && !isplace; j++) {
                    isplace = (classes[j].children[0].innerHTML == "place");
                    if (isplace) index = i;
                }
            }
            if (isplace) {
                var queryURI = results[index].children[1].innerHTML; //"<URI>" :  indice 1
                //On lance la requete et l'affichage
                var peopleRes;
                var infoRes;
                if(place.types.includes('country')) {
                    loadCountryPeople(place.formatted_address, 10);
                    loadCountryInfo(queryURI);
                }
                else
                    loadPlaceInfo(queryURI);
                youtubeRequest(input.value);
            }
        }
    }

    searchBox.addListener('places_changed', earthquakeResearch);

    document.getElementById('searchButton').onclick = () => {
        google.maps.event.trigger(input, 'focus', {});
        google.maps.event.trigger(input, 'keydown', {keyCode : 13});
        google.maps.event.trigger(this, 'focus', {});
        if(!input.value)
        {
            if (marker) marker.setMap(null);
            putEarthquake(null)
        }
    }

    /******* Seismes *******/

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

function loadEarthquakeLayerBis(eq, limit = 100) {
    eraseEarthquakeLayer();

    var query = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&jsonerror=true';
    query += '&limit=' + limit;

    for (let key in eq) {
        if (eq[key] && eq[key] != "" && eq[key] != null) query += '&' + key + '=' + eq[key];
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


function strToInt(num) {
    if (num.length == 0) return null;
    else return parseInt(num);
}

function strToFloat(num) {
    if (num.length == 0) return null;
    else return parseFloat(num);
}
