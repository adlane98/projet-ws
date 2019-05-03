var arrYTID = Array(5).fill(null);

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
        arrYTID[i] = results.items[i].id.videoId;
        videoLinksContents.innerHTML += '<button type="button" class="list-group-item list-group-item-action" onClick="loadVideo(' + i + ')">'
                                        + results.items[i].snippet.title + '</button>'
    }
}


var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementById('videoZoneScript');
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '360',
        width: '640',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
  //event.target.playVideo();
}

var done = false;
function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING && !done) {
      setTimeout(stopVideo, 6000);
      done = true;
    }
}

function stopVideo() {
    player.stopVideo();
}

function loadVideo(num) {
    player.loadVideoById(arrYTID[num]);
}
