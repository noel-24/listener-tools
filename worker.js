import assets from './assets.js';
import channels from './channels.js';

async function query(resource, params, key) {
    const url = new URL('https://www.googleapis.com/youtube/v3/' + resource);
    url.search = new URLSearchParams({ ...params, key });
    const response = await fetch(url);
    if (!response.ok) throw new Error('YouTube API の取得に失敗しました');
    return (await response.json()).items;
}

async function listLives(key) {
    const ids = new Set();
    let failures = 0;
    for (let start = 0; start < channels.length; start += 6) {
        await Promise.all(channels.slice(start, start + 6).map(async channel => {
            try {
                const items = await query('playlistItems', { playlistId: 'UU' + channel.slice(2), part: 'contentDetails', maxResults: '5' }, key);
                for (const item of items) ids.add(item.contentDetails.videoId);
            } catch { failures++; }
        }));
    }
    if (failures === channels.length) throw new Error('チャンネル一覧を確認できませんでした');
    const lives = [];
    const candidates = [...ids];
    for (let i = 0; i < candidates.length; i += 50) {
        const items = await query('videos', { id: candidates.slice(i, i + 50).join(','), part: 'snippet,liveStreamingDetails' }, key);
        for (const item of items) {
            const details = item.liveStreamingDetails;
            if (details?.actualStartTime && !details.actualEndTime) lives.push({ videoId: item.id, title: item.snippet.title, channelTitle: item.snippet.channelTitle });
        }
    }
    return { lives, checkedAt: Date.now(), partial: failures > 0 };
}

export default {
    async fetch(request, env, ctx) {
        if (!request.headers.has('Cf-Access-Jwt-Assertion')) return new Response('Access required', { status: 403 });
        if (request.method !== 'GET') return new Response(null, { status: 405 });
        const url = new URL(request.url);
        if (url.pathname === '/api/lives') {
            if (!env.YOUTUBE_API_KEY) return Response.json({ error: 'YouTube API キーの設定待ちです' }, { status: 503 });
            const cacheKey = new Request(url.origin + '/api/lives');
            const cached = await caches.default.match(cacheKey);
            if (cached) return Response.json(await cached.json(), { headers: { 'Cache-Control': 'no-store' } });
            try {
                const data = await listLives(env.YOUTUBE_API_KEY);
                ctx.waitUntil(caches.default.put(cacheKey, Response.json(data, { headers: { 'Cache-Control': 'public, max-age=120' } })));
                return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
            } catch (error) { return Response.json({ error: error.message }, { status: 502 }); }
        }
        const path = url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname;
        const asset = assets[path];
        if (!asset) return new Response('Not found', { status: 404 });
        return new Response(asset, { headers: { 'Content-Type': ({ html: 'text/html', css: 'text/css', js: 'text/javascript' })[path.split('.').pop()] + '; charset=utf-8', 'Cache-Control': 'private, no-cache' } });
    }
};