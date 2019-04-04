function makeRequest(query, callback) {
    var request = 'http://dbpedia.org/sparql?default-graph-uri=&query='
                + encodeURIComponent(query).replace(/'/g,"%27").replace(/"/g,"%22")
                + '&format=application%2Fsparql-results%2Bjson';

    var xhr = new XMLHttpRequest();
    xhr.open("GET", request, true);
    xhr.send(null);
    xhr.addEventListener("load", callback);
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
                  +     "FILTER(LANG(?name)='en' && LANG(?desc)='en' && REGEX(?countryName, '" + country + "', 'i')) ."
                  + '} LIMIT ' + nb;

        makeRequest(query, peopleCallback);
    }
}

function peopleCallback() {
    var results;
    try{results = JSON.parse(this.responseText).results.bindings;}
    catch{}
    console.log(results); // TODO: traiter les resultats de la requete
}


function loadCountryInfo(country) {
    if (country) {
        var query = 'PREFIX dbpedia-owl: <http://dbpedia.org/ontology/>'
                  + 'PREFIX dbpedia: <http://dbpedia.org/resource/>'
                  + 'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>'
                  + 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>'
                  + 'SELECT DISTINCT * WHERE {'
                  +     '?country a dbpedia-owl:Country ;'
                  +              'dbpedia-owl:populationTotal ?population ;'
                  +              'rdfs:label ?countryName .'
                  + '} LIMIT 1';

        makeRequest(query, infoCallback);
    }
}

function infoCallback() {
    var results;
    try{results = JSON.parse(this.responseText).results.bindings[0];}
    catch{}
    console.log(results); // TODO: traiter les resultats de la requete
}
