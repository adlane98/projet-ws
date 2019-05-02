function youtubeRequest(keyword) {
    var request = 'https://www.googleapis.com/youtube/v3/search?type=video'
                + '&key=AIzaSyCvM8ENjaBYUOERtQEhlcfFGOxF8T248CE'
                + '&part=snippet'
                + '&order=relevance'
                + '&q=' + keyword;
                // + '&maxResults=5'
                // + '&location=' + lat + "," + lng
                // + '&locationRadius=' + rad + "km";

    var xhr = new XMLHttpRequest();
    xhr.open("GET", request, true);
    xhr.send(null);
    xhr.addEventListener("load", youtubeCallback);
}

function youtubeCallback() {
    var results;
    try{results = JSON.parse(this.responseText);}
    catch{}
    console.log(results); // TODO: traiter les resultats de la requete
    var yz = document.getElementById("videoLinksZone");
    yz.hidden = false;

    var videoLinksContents = document.getElementById("videoLinksContents");
    for (i = 0; i < results.items.length; i++) {
        videoLinksContents.innerHTML += '<li class="list-group-item"> <a href=https://youtube.com/watch?v=' + results.items[i].id.videoId + '>' + results.items[i].snippet.title + '</a> </li>'
    }
}
