import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: Request) {
  try {
    const { url, platform } = await req.json();

    // 1. 存入 Supabase
    await supabase.from('songs').insert([{ url, platform }]);

    // 2. 如果是 Spotify，自動加進歌單
    if (platform === 'Spotify') {
      const trackIdMatch = url.match(/track\/([a-zA-Z0-9]+)/);
      if (trackIdMatch) {
        const trackId = trackIdMatch[1];
        
        // 換取代幣
        const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: process.env.SPOTIFY_REFRESH_TOKEN!
          })
        });
        const tokenData = await tokenRes.json();
        
        if (!tokenData.access_token) {
          return NextResponse.json({ error: 'Spotify 授權金鑰換取失敗' }, { status: 400 });
        }

        // 🚨 防彈版網址拼接：絕對不會漏掉 ID
        const spotifyUrl = 'https://api.spotify.com/v1/playlists/' + process.env.SPOTIFY_PLAYLIST_ID + '/tracks';

        // 將歌曲塞進官方歌單
        const spotifyRes = await fetch(spotifyUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ uris: ['spotify:track:' + trackId] })
        });

        if (!spotifyRes.ok) {
          const spotifyError = await spotifyRes.json();
          return NextResponse.json({ error: `Spotify 拒絕了：${spotifyError.error?.message || '未知錯誤'}` }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: '網址格式不對，找不到歌曲 ID' }, { status: 400 });
      }
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: `系統錯誤：${error.message}` }, { status: 500 });
  }
}
