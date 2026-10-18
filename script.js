
let currentSong = new Audio();
let songs = [];
let currentFolder = "";
let play;

// GitHub repository ka project path
const BASE_PATH = "/Spotify/";

function getURL(path) {
    return new URL(
        path.replace(/^\/+/, ""),
        window.location.origin + BASE_PATH
    ).href;
}

// Time formatter
function formatSecondsToMinuteSeconds(seconds) {
    if (!Number.isFinite(seconds)) return "00:00";

    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = Math.floor(seconds % 60);

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

// Song filename
function getCleanName(track) {
    try {
        return decodeURIComponent(track)
            .replace(/\\/g, "/")
            .split("/")
            .pop()
            .replace(/\.mp3$/i, "");
    } catch {
        return track;
    }
}

// Load songs from songs.json
async function GetSongs(folder) {
    currentFolder = folder;

    try {
        let response = await fetch(getURL(`${folder}/songs.json`));

        if (!response.ok) {
            throw new Error(
                `Could not load ${folder}/songs.json: ${response.status}`
            );
        }

        let files = await response.json();

        if (!Array.isArray(files)) {
            throw new Error("songs.json must contain an array of filenames");
        }

        songs = files.map(file => getURL(`${folder}/${file}`));

    } catch (error) {
        console.error("GetSongs error:", error);
        songs = [];
    }
}

// Play a song
function PlaySong(track, pause = false) {
    if (!track) return;

    currentSong.src = track;

    if (!pause) {
        currentSong.play()
            .then(() => {
                if (play) play.src = getURL("pause.svg");
            })
            .catch(error => {
                console.error("Audio playback error:", error);
            });
    } else if (play) {
        play.src = getURL("play.svg");
    }

    document.querySelector(".songinfo").textContent =
        getCleanName(track);

    document.querySelector(".songtime").textContent = "00:00 / 00:00";
}

// Display album cards
async function displayAlbums() {
    const cardContainer = document.querySelector(".cardContainer");

    if (!cardContainer) return;

    cardContainer.innerHTML = "";

    try {
        const response = await fetch(getURL("albums.json"));

        if (!response.ok) {
            throw new Error(`albums.json: HTTP ${response.status}`);
        }

        const albums = await response.json();

        for (const album of albums) {
            const card = document.createElement("div");
            card.className = "card";
            card.dataset.folder = album.folder;

            card.innerHTML = `
                <div class="play">
                    <svg xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48" width="35" height="35">
                        <circle cx="24" cy="24" r="24" fill="#1ed760"/>
                        <path d="M19 14.5a1 1 0 0 0-1.5.87v17.26a1 1 0 0 0 1.5.87l14-8.63a1 1 0 0 0 0-1.74z"
                            fill="#000"/>
                    </svg>
                </div>
                <img loading="lazy" alt="">
                <h2></h2>
                <p></p>
            `;

            card.querySelector("img").src =
                getURL(`songs/${album.folder}/cover.jpg`);

            card.querySelector("img").alt = album.title;
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
        console.error("displayAlbums error:", error);
    }
}

// Render the song list
function renderSongs() {
    const songUL = document.querySelector(".songList ul");

    if (!songUL) return;

    songUL.innerHTML = "";

    songs.forEach((song, index) => {
        const li = document.createElement("li");
        li.className = "player";

        li.innerHTML = `
            <img class="invert" alt="">
            <div class="info">
                <div class="song-name"></div>
                <div>Ultimate</div>
            </div>
            <div class="playnow">
                <span>Play now</span>
                <img class="invert" alt="">
            </div>
        `;

        li.querySelector(".info img");

        li.querySelector(".invert").src = getURL("music.svg");

        const playIcon = li.querySelector(".playnow img");
        playIcon.src = getURL("play.svg");

        li.querySelector(".song-name").textContent =
            getCleanName(song);

        li.addEventListener("click", () => {
            PlaySong(song);
        });

        songUL.appendChild(li);
    });
}

// Main
async function main() {
    play = document.querySelector("#play");

    await displayAlbums();

    await GetSongs("songs/cs");
    renderSongs();

    if (songs.length > 0) {
        PlaySong(songs[0], true);
    }

    // Global play/pause
    play?.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play()
                .then(() => {
                    play.src = getURL("pause.svg");
                })
                .catch(console.error);
        } else {
            currentSong.pause();
            play.src = getURL("play.svg");
        }
    });

    // Update playback time and seekbar
    currentSong.addEventListener("timeupdate", () => {
        const songtime = document.querySelector(".songtime");
        const circle = document.querySelector(".circle");

        if (songtime) {
            songtime.textContent =
                `${formatSecondsToMinuteSeconds(currentSong.currentTime)} / ${formatSecondsToMinuteSeconds(currentSong.duration)}`;
        }

        if (circle && currentSong.duration) {
            circle.style.left =
                (currentSong.currentTime / currentSong.duration) * 100 + "%";
        }
    });

    // Automatically play next song when current song ends
    currentSong.addEventListener("ended", () => {
        if (!songs.length) return;

        let index = songs.indexOf(currentSong.src);
        PlaySong(songs[(index + 1) % songs.length]);
    });

    // Seekbar
    document.querySelector(".seekbar")?.addEventListener("click", e => {
        const seekbar = e.currentTarget;
        const percent = Math.max(
            0,
            Math.min(1, e.offsetX / seekbar.offsetWidth)
        );

        const circle = document.querySelector(".circle");

        if (circle) {
            circle.style.left = percent * 100 + "%";
        }

        if (Number.isFinite(currentSong.duration)) {
            currentSong.currentTime = currentSong.duration * percent;
        }
    });

    // Mobile sidebar
    document.querySelector(".hamburger")?.addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close")?.addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Volume slider
    const volumeInput = document.querySelector(".range input");

    if (volumeInput) {
        volumeInput.addEventListener("input", e => {
            currentSong.volume = Number(e.target.value) / 100;

            const volumeIcon = document.querySelector(".volume > img");

            if (volumeIcon) {
                volumeIcon.src = getURL(
                    currentSong.volume === 0 ? "mute.svg" : "volume.svg"
                );
            }
        });
    }

    // Mute/unmute
    document.querySelector(".volume > img")?.addEventListener("click", e => {
        const image = e.currentTarget;
        const muted = currentSong.volume > 0;

        currentSong.volume = muted ? 0 : 0.1;
        image.src = getURL(muted ? "mute.svg" : "volume.svg");

        if (volumeInput) {
            volumeInput.value = muted ? 0 : 10;
        }
    });

    // Previous song
    document.querySelector("#previous")?.addEventListener("click", () => {
        if (!songs.length) return;

        let index = songs.indexOf(currentSong.src);
        index = index <= 0 ? songs.length - 1 : index - 1;

        PlaySong(songs[index]);
    });

    // Next song
    document.querySelector("#next")?.addEventListener("click", () => {
        if (!songs.length) return;

        let index = songs.indexOf(currentSong.src);
        index = index < 0 || index >= songs.length - 1 ? 0 : index + 1;

        PlaySong(songs[index]);
    });
}

main();
