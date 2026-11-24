let ONLINE_LIVES = []; 
let currentIndex = 0;
let player = null; 

const chatContainer = document.getElementById('chat-container');
const sideWrapper = document.getElementById('side-wrapper');
const liveListUl = document.getElementById('live-list-ul');
const liveTitle = document.getElementById('live-title');
const loadingOverlay = document.getElementById('loading');
const volumeSlider = document.getElementById('volume-slider');
const openYtBtn = document.getElementById('open-yt-btn');

const paneList = document.getElementById('pane-list');
const paneChat = document.getElementById('pane-chat');
const listTab = document.getElementById('list-tab');
const chatTab = document.getElementById('chat-tab');

function onYouTubeIframeAPIReady() {
    fetchOnlineLives();
}

let fetching = false;
async function fetchOnlineLives() {
    if (fetching) return;
    fetching = true;
    loadingOverlay.classList.remove('hidden');
    const previous = ONLINE_LIVES[currentIndex]?.videoId;
    try {
        const response = await fetch('/api/lives');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '一覧を取得できませんでした');
        ONLINE_LIVES = data.lives;
        if (!ONLINE_LIVES.length) {
            showNoLive();
            if (data.partial) liveTitle.textContent = '一部のチャンネルを確認できませんでした';
            return;
        }
        createListView();
        const index = ONLINE_LIVES.findIndex(live => live.videoId === previous);
        if (index < 0) initOrUpdatePlayer(Math.floor(Math.random() * ONLINE_LIVES.length));
        else {
            currentIndex = index;
            liveListUl.children[index].classList.add('active');
        }
    } catch (error) {
        liveTitle.textContent = error.message;
    } finally {
        fetching = false;
        loadingOverlay.classList.add('hidden');
    }
}

function showNoLive() {
    loadingOverlay.classList.add('hidden');
    liveTitle.textContent = "😢 現在ライブ配信中のチャンネルはありません。";
    if (player) { player.destroy(); player = null; }
    chatContainer.innerHTML = "";
    liveListUl.innerHTML = "<li style='color: #888;'>配信中の番組はありません</li>";
    openYtBtn.disabled = true; // 🟢
}

function createListView() {
    liveListUl.innerHTML = "";
    ONLINE_LIVES.forEach((live, index) => {
        const li = document.createElement('li');
        li.className = 'live-item';
        li.id = `live-item-${index}`;
        li.textContent = live.channelTitle + '　' + live.title;
        li.addEventListener('click', () => {
            initOrUpdatePlayer(index);
        });
        liveListUl.appendChild(li);
    });
}

function initOrUpdatePlayer(index) {
    if (ONLINE_LIVES.length === 0) return;
    
    document.querySelectorAll('.live-item').forEach(el => el.classList.remove('active'));
    const currentListItem = document.getElementById(`live-item-${index}`);
    if (currentListItem) currentListItem.classList.add('active');

    currentIndex = index;
    const live = ONLINE_LIVES[currentIndex];
    
    liveTitle.textContent = live.title + ' ［' + live.channelTitle + '］';
    openYtBtn.disabled = false;

    const chatUrl = `https://www.youtube.com/live_chat?v=${live.videoId}&embed_domain=${window.location.hostname}`;
    chatContainer.innerHTML = `<iframe src="${chatUrl}"></iframe>`;

    const currentVolume = volumeSlider.value;

    if (!player) {
        if (!document.getElementById('youtube-player')) { const mount = document.createElement('div'); mount.id = 'youtube-player'; document.querySelector('.video-area').append(mount); }
        player = new YT.Player('youtube-player', {
            videoId: live.videoId,
            playerVars: {
                autoplay: 1,
                mute: 0,
                controls: 0, 
                rel: 0,
                modestbranding: 1
            },
            events: {
                onReady: (event) => {
                    event.target.unMute(); 
                    event.target.setVolume(currentVolume);
                    event.target.playVideo();
                },
                onStateChange: (event) => {
                    if (event.data === YT.PlayerState.PLAYING) {
                        event.target.unMute();
                        event.target.setVolume(volumeSlider.value);
                    }
                }
            }
        });
    } else {
        player.loadVideoById({ videoId: live.videoId });
        player.unMute();
        player.setVolume(currentVolume);
    }
}

// YouTube本家を開くボタンのクリックイベント
openYtBtn.addEventListener('click', () => {
    if (ONLINE_LIVES.length === 0) return;
    const currentLive = ONLINE_LIVES[currentIndex];
    const youtubeUrl = `https://www.youtube.com/watch?v=${currentLive.videoId}`;
    window.open(youtubeUrl, '_blank');
});

volumeSlider.addEventListener('input', (e) => {
    if (player && typeof player.setVolume === 'function') {
        player.unMute();
        player.setVolume(e.target.value);
    }
});

// シャッフルボタン
document.getElementById('shuffle-btn').addEventListener('click', () => {
    if (ONLINE_LIVES.length <= 1) return;
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * ONLINE_LIVES.length);
    } while (randomIndex === currentIndex);
    initOrUpdatePlayer(randomIndex);
});

// リログボタン
document.getElementById('relog-btn').addEventListener('click', () => {
    fetchOnlineLives();
});

// サイドコンテナの開閉・切り替えロジック
function toggleSideContainer(targetType) {
    const isContainerOpen = sideWrapper.classList.contains('open');
    const isCurrentActive = (targetType === 'list' && listTab.classList.contains('active')) || 
                            (targetType === 'chat' && chatTab.classList.contains('active'));

    if (isContainerOpen && isCurrentActive) {
        sideWrapper.classList.remove('open');
        listTab.classList.remove('active');
        chatTab.classList.remove('active');
        return;
    }

    if (targetType === 'list') {
        listTab.classList.add('active');
        chatTab.classList.remove('active');
        paneList.classList.remove('hidden');
        paneChat.classList.add('hidden');
    } else {
        chatTab.classList.add('active');
        listTab.classList.remove('active');
        paneChat.classList.remove('hidden');
        paneList.classList.add('hidden');
    }

    sideWrapper.classList.add('open');
}

listTab.addEventListener('click', () => toggleSideContainer('list'));
chatTab.addEventListener('click', () => toggleSideContainer('chat'));