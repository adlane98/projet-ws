var infoResults;
var peopleResults;
var titleFields = {"countryName": "Pays", "superficie": "Superficie", "population": "Population", "currencyName": "Devise", "langueName": "Langue"}
var peopleFields = {"name": "Nom", "desc": "Description"};

function makeRequest(request, callback) {
    console.log("Requete envoyee : " + request);
    var xhr = new XMLHttpRequest();
    xhr.open("GET", request, true);
    xhr.send(null);
    xhr.addEventListener("load", callback);
}

function makeRequestDBpedia(query, callback) {
    var request = 'http://dbpedia.org/sparql?default-graph-uri=&query='
                + encodeURIComponent(query).replace(/'/g,"%27").replace(/"/g,"%22")
                + '&format=application%2Fsparql-results%2Bjson';

    makeRequest(request, callback);
}


function loadCountryPeople(country, nb = 10) {
    if (country) {
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
                  +     "FILTER(LANG(?name)='fr' && LANG(?desc)='fr' && REGEX(?countryName, '" + country + "', 'i')) ."
                  + '} LIMIT ' + nb;

        makeRequestDBpedia(query, peopleCallback);
    }
}

function peopleCallback() {
    try{results = JSON.parse(this.responseText).results.bindings;}
    catch{}

    var peopleResultsZone = document.getElementById("peopleResultsZone");
    var prz = document.getElementById("peopleResultsZone");
    prz.hidden = false;

    //On recupere le contenu sous forme d'un tableau d'ensembles pour eviter les doublons
    var contents = new Object();
    for (var key in peopleFields) {
        var resultsSet = new Set();
        for (var i = 0; i < results.length; i++) {
            if (results[i][key]) resultsSet.add(results[i][key].value);
        }
        if (resultsSet.size > 0) contents[key] = resultsSet;
    }

    var peopleResultsContents = document.getElementById("peopleResultsContents");
    for (var i = 0; i < results.length; i++)
        peopleResultsContents.innerHTML += '<li class="list-group-item"><strong>' + results[i]["name"].value + '</strong>' + ' : ' + results[i]["desc"].value + '</li>';
}


function loadCountryInfo(uriplace) {
    if (uriplace) {
        var query =     'PREFIX dbo: <http://dbpedia.org/ontology/>'
                    +   'PREFIX dbp: <http://dbpedia.org/property/>'
                    +   'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>'
                    +   'SELECT DISTINCT ?name, ?countryName, ?superficie, ?population, ?currencyName, ?langueName '
                    +   'WHERE {'
                    +       'OPTIONAL {' + '<' + uriplace + '>' + 'rdfs:label ?name. FILTER langMatches( lang(?name), "FR" ) }'
                    +       'OPTIONAL {' + '<' + uriplace + '>' + 'rdfs:label ?name. FILTER langMatches( lang(?name), "EN" ) }'


                    +       'OPTIONAL {' + '<' + uriplace + '>' + 'dbo:PopulatedPlace ?superficie.}'
                    +       'OPTIONAL {' + '<' + uriplace + '>' + 'dbo:areaTotal ?superficie.}'

                    +       'OPTIONAL {' + '<' + uriplace + '>' + 'dbo:populationTotal ?population.}'

                    +       'OPTIONAL {'
                    +           '<' + uriplace + '>' + 'dbo:currency ?devise.'
                    +           '?devise rdfs:label ?currencyName. FILTER langMatches( lang(?currencyName), "FR")'
                    +       '}'
                    +       'OPTIONAL {'
                    +           '<' + uriplace + '>' + 'dbo:currency ?devise.'
                    +           '?devise rdfs:label ?currencyName. FILTER langMatches( lang(?currencyName), "EN")'
                    +       '}'

                    +       'OPTIONAL {'
                    +           '<' + uriplace + '>' + 'dbo:language ?langue.'
                    +           '?langue rdfs:label ?langueName. FILTER langMatches( lang(?langueName), "FR")'
                    +       '}'
                    +       'OPTIONAL {'
                    +           '<' + uriplace + '>' + 'dbo:language ?langue.'
                    +           '?langue rdfs:label ?langueName. FILTER langMatches( lang(?langueName), "EN")'
                    +       '}'
                    +   '} LIMIT 20';

        makeRequestDBpedia(query, countryInfoCallback);
    }
}

function countryInfoCallback() {
    try{infoResults = JSON.parse(this.responseText).results.bindings;}
    catch{}
    console.log("country info call back");
    console.log(infoResults); // TODO: traiter les resultats de la requete

    if (infoResults) displayResultsInfo(infoResults)
}


function loadPlaceInfo(uriplace) {
    var query   =   'PREFIX dbo: <http://dbpedia.org/ontology/>'
                +   'PREFIX dbp: <http://dbpedia.org/property/>'
                +   'PREFIX dct: <http://purl.org/dc/terms/>'
                +   'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>'
                +   'SELECT DISTINCT ?name, ?countryName, ?superficie, ?population, ?currencyName, ?langueName '
                +   'WHERE {'
                +       'OPTIONAL {' + '<' + uriplace + '>' + 'rdfs:label ?name. FILTER langMatches( lang(?name), "FR" ) }'
                +       'OPTIONAL {' + '<' + uriplace + '>' + 'rdfs:label ?name. FILTER langMatches( lang(?name), "EN" ) }'


                +       'OPTIONAL {'
                +           '<' + uriplace + '>' + '?countryProperty ?country.'
                +           '?country rdfs:label ?countryName. FILTER langMatches( lang(?countryName), "FR")'
                +       '}'
                +       'OPTIONAL {'
                +           '<' + uriplace + '>' + '?countryProperty ?country.'
                +           '?country rdfs:label ?countryName. FILTER langMatches( lang(?countryName), "EN")'
                +       '}'
                +       'FILTER ((?countryProperty = dbo:country || ?countryProperty = dbp:country) && ?countryProperty != dct:subject)'

                +       'OPTIONAL {'
                +           '<' + uriplace + '>' + 'dbp:region ?region.'
                +           '?region dbo:country ?country.'
                +           '?country rdfs:label ?countryName. FILTER langMatches( lang(?countryName), "FR")'
                +       '}'
                +       'OPTIONAL {'
                +           '<' + uriplace + '>' + 'dbp:region ?region.'
                +           '?region dbo:country ?country.'
                +           '?country rdfs:label ?countryName. FILTER langMatches( lang(?countryName), "EN")'
                +       '}'

                +       'OPTIONAL {' + '<' + uriplace + '>' + 'dbo:PopulatedPlace ?superficie.}'
                +       'OPTIONAL {' + '<' + uriplace + '>' + 'dbo:areaTotal ?superficie.}'

                +       'OPTIONAL {' + '<' + uriplace + '>' + 'dbo:populationTotal ?population.}'

                +       'OPTIONAL {'
                +           '<' + uriplace + '>' + 'dbo:currency ?devise.'
                +           '?devise rdfs:label ?currencyName. FILTER langMatches( lang(?currencyName), "FR")'
                +       '}'
                +       'OPTIONAL {'
                +           '<' + uriplace + '>' + 'dbo:currency ?devise.'
                +           '?devise rdfs:label ?currencyName. FILTER langMatches( lang(?currencyName), "EN")'
                +       '}'

                +       'OPTIONAL {'
                +           '<' + uriplace + '>' + 'dbo:language ?langue.'
                +           '?langue rdfs:label ?langueName. FILTER langMatches( lang(?langueName), "FR")'
                +       '}'
                +       'OPTIONAL {'
                +           '<' + uriplace + '>' + 'dbo:language ?langue.'
                +           '?langue rdfs:label ?langueName. FILTER langMatches( lang(?langueName), "EN")'
                +       '}'
                +   '} LIMIT 20';

    makeRequestDBpedia(query, placeInfoCallback);
}

function placeInfoCallback() {
    try{infoResults = JSON.parse(this.responseText).results.bindings;}
    catch{}

    if (infoResults) displayResultsInfo(infoResults)
}

function displayResultsInfo(results) {
    var searchInfoTitle = document.getElementById("searchInfoTitle");
    searchInfoTitle.innerHTML = results[0].name.value;
    var drz = document.getElementById("dbpediaResultsZone");
    drz.hidden = false;

    //On recupere le contenu sous forme d'un tableau d'ensembles pour eviter les doublons
    var contents = new Object();
    for (var key in titleFields) {
        var resultsSet = new Set();
        for (var i = 0; i < results.length; i++) {
            if (results[i][key]) resultsSet.add(results[i][key].value);
        }
        if (resultsSet.size > 0) contents[key] = resultsSet;
    }

    //On affiche le contenu
    var searchInfoContents = document.getElementById("searchInfoContents");
    for (var key in contents) {
        for (let item of contents[key].values()) {
            if (key == "superficie")
                searchInfoContents.innerHTML += '<li class="list-group-item">' + titleFields[key] + ' : ' + (item / 100000) + ' km²</li>';
            else searchInfoContents.innerHTML += '<li class="list-group-item">' + titleFields[key] + ' : ' + item + '</li>';
        }
    }
}
