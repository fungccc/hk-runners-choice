import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: Request) {
  try {
    const { url, platform } = await req.json();

    // 1. 存入 Supabase 資料庫
    await supabase.from('songs').insert([{ url, platform }]);

    // 2. 如果是 Spotify，自動加進歌單
    if (platform === 'Spotify') {
      const trackIdMatch = url.match(/track\/([a-zA-Z0-9]+)/);
      if (trackIdMatch) {
        const trackId = trackIdMatch[1];
        
        // 用你的 Refresh Token 換取當下可用的 Access Token
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
        
        // 將歌曲塞進你的官方歌單
        await fetch(`https://api.spotify.com/v1/playlists/${process.env.SPOTIFY_PLAYLIST_ID}/tracks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ uris: [`spotify:track:${trackId}`] })
        });
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '處理失敗' }, { status: 500 });
  }
}
