const button = document.querySelector('#refresh');
const statusLine = document.querySelector('#status');
async function refresh() {
    button.disabled = true;
    statusLine.textContent = '配信状況を確認中…';
    try {
        const response = await fetch('/api/lives');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '取得に失敗しました');
        const rows = data.lives.map(live => {
            const row = document.createElement('li');
            const link = document.createElement('a');
            link.href = 'https://www.youtube.com/watch?v=' + encodeURIComponent(live.videoId);
            link.target = '_blank';
            link.rel = 'noopener';
            link.textContent = live.title;
            const channel = document.createElement('small');
            channel.textContent = live.channelTitle;
            row.append(channel, link);
            return row;
        });
        document.querySelector('#lives').replaceChildren(...rows);
        statusLine.textContent = (rows.length ? rows.length + '件の配信' : '確認できた配信はありません') + ' · ' + new Date(data.checkedAt).toLocaleTimeString('ja-JP') + '確認' + (data.partial ? '（一部取得失敗）' : '');
    } catch (error) { statusLine.textContent = error.message; }
    finally { button.disabled = false; }
}
button.addEventListener('click', refresh);
refresh();