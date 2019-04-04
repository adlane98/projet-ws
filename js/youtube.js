function youtubeRequest(lat, lng, rad) {
    var request = 'https://www.googleapis.com/youtube/v3/search?type=video'
                + '&key=AIzaSyCvM8ENjaBYUOERtQEhlcfFGOxF8T248CE'
                + '&part=snippet'
                + '&order=relevance'
                + '&maxResults=5'
                + '&location=' + lat + "," + lng
                + '&locationRadius=' + rad + "km";

    var xhr = new XMLHttpRequest();
    xhr.open("GET", request, true);
    xhr.send(null);
    xhr.addEventListener("load", function() {
                                                var results;
                                                try{results = JSON.parse(this.responseText);}
                                                catch{}
                                                console.log(results); // TODO: traiter les resultats de la requete
                                            });
}
