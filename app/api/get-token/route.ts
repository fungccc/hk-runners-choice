import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: "老闆，請在網址最後面加上 ?code=你的亂碼" });
  }

  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: 'http://127.0.0.1:3000/api/auth/callback/spotify'
    })
  });

  const data = await response.json();
  
  if (data.refresh_token) {
    return NextResponse.json({
      message: "🎉 成功！請複製下面的 refresh_token，並將它加到 Vercel 的 Environment Variables 中，命名為 SPOTIFY_REFRESH_TOKEN",
      refresh_token: data.refresh_token
    });
  } else {
    return NextResponse.json({ error: "兌換失敗，可能是 code 過期了，請重新獲取！", details: data });
  }
}
