let currentSong = new Audio();
let songs = [] ;
let currentFolder;

function formatSecondsToMinuteSeconds(seconds) {
    if (isNaN(seconds)) return "00:00";
    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}


function getCleanName(track) {
    return decodeURIComponent(track)
        .replace(/\\/g, "/")                  // Convert all backslashes to forward slashes
        .replace(/^http?:\/\/[^\/]+\/?/, "") // Remove domain
        .replace(/songs[\/\\]?/gi, "")        // Remove 'songs/' or 'songs\'
        .replace(/^[\/\\]+/, "").split("/").pop() ;        // Remove leading slashes
}

async function GetSongs(folder) {
    currentFolder = folder;
let a = await fetch(`/${folder}`);
    let response = await a.text();

    const div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
   songs = [];

    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
      songs.push(element.href.replace(/\\/g, "/").replace(/%5C/gi, "/").replace("3000//", "3000/"));
        }
    }

}

const PlaySong = (track, pause = false) => {

    currentSong.src =  track;
    if (!pause) {
        currentSong.play();
        play.src = "pause.svg";
    }

    document.querySelector(".songinfo").innerHTML = getCleanName(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

async function displayAlbums(){
let a = await fetch(`/songs/`);
let response =await a.text();
let div = document.createElement("div")
div.innerHTML = response;
let cardContainer = document.querySelector(".cardContainer")
console.log(div)
let anchors = Array.from(div.getElementsByTagName("a")).forEach( async element => {
    if(element.href.includes("songs")){
    // console.log(element.href)
     let folder = decodeURI(element.href).replace("\\songs\\" , "")
    .split("/")
    .filter(Boolean)
    .pop();

    let a = await fetch(`/songs/${folder}/info.json`);
let response =await a.json();
console.log(response)

cardContainer.innerHTML +=  `     <div data-folder="${folder}" class="card ">
                        <div class="play">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="35" height="35">
                                <circle cx="24" cy="24" r="24" fill="#1ed760" />
                                <path d="M19 14.5a1 1 0 0 0-1.5.87v17.26a1 1 0 0 0 1.5.87l14-8.63a1 1 0 0 0 0-1.74z"
                                    fill="#000" />
                            </svg>
                        </div>
                    <img aria-hidden="false" draggable="false" loading="lazy" src="/songs/${folder}/cover.jpg" data-image-status="loaded" data-testid="card-image" alt="" class="L6IwYSgXPAr7UR5vlZSa D8HBNHpyhCpooM3VbkCG tkaaEBl7rCDlFdPtFbTg x6M1ibmxldITwhXYfrM1 TxO4cJyIggVYNxMM2az4">
                        <h2>${response.title}</h2>
                        <p>${response.description}</p>

                    </div> `


    
}
});


}

async function main() {
    // 1. Get all songs
     await displayAlbums();
await GetSongs("songs/cs");

renderSongs();

    if (songs.length > 0) {
        PlaySong(songs[0], true);
    }

   

    // 4. Global Play/Pause Button Listener
    const play = document.querySelector("#play") || document.getElementById("play");
    if (play) {
        play.addEventListener("click", () => {
            if (currentSong.paused) {
                currentSong.play();
                play.src = "pause.svg";
            } else {
                currentSong.pause();
                play.src = "play.svg";
            }
        });
    }

    // 5. Timeupdate event listener for song progress
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${formatSecondsToMinuteSeconds(currentSong.currentTime)} / ${formatSecondsToMinuteSeconds(currentSong.duration)}`;
        if (currentSong.duration) {
            document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
        }
    });

    // 6. Seekbar Click Listener
    document.querySelector(".seekbar").addEventListener("click", (e) => {
        let percent = (e.offsetX / e.target.offsetWidth) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        if (!isNaN(currentSong.duration)) {
            currentSong.currentTime = (currentSong.duration * percent) / 100;
        }
    });

    document.querySelector(".hamburger").addEventListener("click" , ()=>{
        document.querySelector(".left").style.left = "0";
    })
    document.querySelector(".close").addEventListener("click" , ()=>{
   document.querySelector(".left").style.left = "-120%";
    })

    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change" , (e)=>{
    currentSong.volume = parseInt(e.target.value )/ 100;
    

    }
)
document.querySelector(".volume>img").addEventListener("click" , (e)=>{
if(e.target.src.includes("volume.svg")){
    e.target.src = e.target.src.replace("volume.svg" , "mute.svg");
    currentSong.volume = 0;
document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
}
else{
           e.target.src= e.target.src.replace ( "mute.svg","volume.svg" );
           currentSong.volume = 0.1;
           document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
}
})


Array.from(document.getElementsByClassName("card")).forEach( async element => {
    // console.log(element.dataset.folder)
    element.addEventListener("click" , async item=>{
        console.log(songs)
await GetSongs(`songs/${item.currentTarget.dataset.folder}`);
renderSongs();
    })
     
    
});


    previous.addEventListener("click" , ()=>{
     let index = songs.indexOf(currentSong.src)
     
     
     if(index != 0 ){
     PlaySong(songs[index-1])
    }
    else{
          PlaySong(songs[songs.length-1]);
    }
        
    })
    next.addEventListener("click" , ()=>{
     let index = songs.indexOf(currentSong.src)
     console.log(index)
     console.log(songs.length)
     if(index < songs.length -1){
     PlaySong(songs[index+1])
     }
     else{
        //condition that no songs are left
        PlaySong(songs[0]);
     }
        
    })

}
function renderSongs(){
     let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = ""; // Clear existing list

    // 2. Render songs in UI
    for (const song of songs) {
        let cleanName = getCleanName(song);

        songUL.innerHTML += `
        <li class="player">
            <img class="invert" src="music.svg" alt="">
            <div class="info">
                <div>${cleanName}</div>
                <div>Ultimate</div>
            </div>
            <div class="playnow">
                <span>Play now</span>
                <img class="invert" src="play.svg" alt="">
            </div>
        </li>`;
    }

    // 3. Attach click listener to each song item
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach((e, index) => {
        e.addEventListener("click", () => {
            PlaySong(songs[index]);
            play.src = "pause.svg";
        });
    });
}


main();
