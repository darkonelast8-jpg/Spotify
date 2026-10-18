
let currentSong = new Audio();
let songs = [];
let currentFolder = "";
let play;

// GitHub Pages project path support
const basePath = window.location.pathname.endsWith("/")
    ? window.location.pathname
    : window.location.pathname.substring(
        0,
        window.location.pathname.lastIndexOf("/") + 1
    );

function getURL(path) {
    return new URL(path.replace(/^\/+/, ""), window.location.origin + basePath).href;
}

function formatSecondsToMinuteSeconds(seconds) {
    if (!Number.isFinite(seconds)) return "00:00";

    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = Math.floor(seconds % 60);

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function getCleanName(track) {
    let name = decodeURIComponent(track)
        .replace(/\\/g, "/")
        .split("/")
        .pop();

    return name.replace(/\.mp3$/i, "");
}

async function GetSongs(folder) {
    currentFolder = folder;

    try {
        let response = await fetch(getURL(`${folder}/songs.json`));

        if (!response.ok) {
            throw new Error(`songs.json not found: ${response.status}`);
        }

        let data = await response.json();

        songs = data.map(song =>
            getURL(`${folder}/${song}`)
        );

    } catch (error) {
        console.error("Songs load nahi hue:", error);
        songs = [];
    }
}

function PlaySong(track, pause = false) {
    currentSong.src = track;

    if (!pause) {
        currentSong.play().catch(error =>
            console.error("Audio play error:", error)
        );

        if (play) play.src = getURL("pause.svg");
    }

    document.querySelector(".songinfo").textContent = getCleanName(track);
    document.querySelector(".songtime").textContent = "00:00 / 00:00";
}

async function displayAlbums() {
    let cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "";

    try {
        let response = await fetch(getURL("albums.json"));

        if (!response.ok) {
            throw new Error(`albums.json error: ${response.status}`);
        }

        let albums = await response.json();

        for (const album of albums) {
            let card = document.createElement("div");
            card.className = "card";
            card.dataset.folder = album.folder;

            let image = getURL(`songs/${album.folder}/cover.jpg`);

            card.innerHTML = `
                <div class="play">
                    <svg xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48" width="35" height="35">
                        <circle cx="24" cy="24" r="24" fill="#1ed760"/>
                        <path d="M19 14.5a1 1 0 0 0-1.5.87v17.26a1 1 0 0 0 1.5.87l14-8.63a1 1 0 0 0 0-1.74z"
                            fill="#000"/>
                    </svg>
                </div>
                <img src="${image}" alt="${album.title}" loading="lazy">
                <h2></h2>
                <p></p>
            `;

            card.querySelector("h2").textContent = album.title;
            card.querySelector("p").textContent = album.description;

            card.addEventListener("click", async () => {
                await GetSongs(`songs/${album.folder}`);
                renderSongs();

                if (songs.length > 0) {
                    PlaySong(songs[0], true);
                }
            });

            cardContainer.appendChild(card);
        }
    } catch (error) {
        console.error("Albums load nahi hue:", error);
    }
}

function renderSongs() {
    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";

    songs.forEach((song, index) => {
        let li = document.createElement("li");
        li.className = "player";

        li.innerHTML = `
            <img class="invert" src="${getURL("music.svg")}" alt="">
            <div class="info">
                <div class="song-name"></div>
                <div>Ultimate</div>
            </div>
            <div class="playnow">
                <span>Play now</span>
                <img class="invert" src="${getURL("play.svg")}" alt="">
            </div>
        `;

        li.querySelector(".song-name").textContent = getCleanName(song);

        li.addEventListener("click", () => {
            PlaySong(song);
        });

        songUL.appendChild(li);
    });
}

async function main() {
    play = document.querySelector("#play");

    await displayAlbums();

    await GetSongs("songs/cs");
    renderSongs();

    if (songs.length > 0) {
        PlaySong(songs[0], true);
    }

    play?.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play().catch(console.error);
            play.src = getURL("pause.svg");
        } else {
            currentSong.pause();
            play.src = getURL("play.svg");
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").textContent =
            `${formatSecondsToMinuteSeconds(currentSong.currentTime)} / ${formatSecondsToMinuteSeconds(currentSong.duration)}`;

        if (currentSong.duration) {
            document.querySelector(".circle").style.left =
                (currentSong.currentTime / currentSong.duration) * 100 + "%";
        }
    });

    currentSong.addEventListener("ended", () => {
        let index = songs.indexOf(currentSong.src);

        if (songs.length > 0) {
            PlaySong(songs[(index + 1) % songs.length]);
        }
    });

    document.querySelector(".seekbar")?.addEventListener("click", e => {
        let seekbar = e.currentTarget;
        let percent = e.offsetX / seekbar.offsetWidth;

        document.querySelector(".circle").style.left =
            percent * 100 + "%";

        if (Number.isFinite(currentSong.duration)) {
            currentSong.currentTime = currentSong.duration * percent;
        }
    });

    document.querySelector(".hamburger")?.addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close")?.addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    let volumeInput = document.querySelector(".range input");

    volumeInput?.addEventListener("input", e => {
        currentSong.volume = Number(e.target.value) / 100;
    });

    document.querySelector(".volume > img")?.addEventListener("click", e => {
        let image = e.currentTarget;
        let muted = image.src.includes("volume.svg");

        currentSong.volume = muted ? 0 : 0.1;
        image.src = getURL(muted ? "mute.svg" : "volume.svg");

        if (volumeInput) {
            volumeInput.value = muted ? 0 : 10;
        }
    });

    document.querySelector("#previous")?.addEventListener("click", () => {
        if (!songs.length) return;

        let index = songs.indexOf(currentSong.src);
        index = index <= 0 ? songs.length - 1 : index - 1;

        PlaySong(songs[index]);
    });

    document.querySelector("#next")?.addEventListener("click", () => {
        if (!songs.length) return;

        let index = songs.indexOf(currentSong.src);
        index = index < 0 || index >= songs.length - 1 ? 0 : index + 1;

        PlaySong(songs[index]);
    });
}

main();
