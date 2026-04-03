'use client';
import { useState } from 'react';

export default function Home() {
  const [link, setLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!link) {
      alert('老闆，請先貼上歌曲連結喔！🏃‍♂️');
      return;
    }
    
    setIsLoading(true);
    const platform = link.includes('spotify') ? 'Spotify' : 'Apple Music';
    
    try {
      const res = await fetch('/api/add-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: link, platform })
      });
      
      const data = await res.json(); // 解析後台傳來的錯誤訊息
      
      if (res.ok) {
        alert(`太棒了！成功收到連結：\n${link}\n\n已經加入香港跑友精選庫，Spotify 歌單也同步更新囉！`);
        setLink('');
      } else {
        // 🚨 這裡會直接告訴你為什麼失敗！
        alert(`哎呀，傳送失敗！\n系統抓到的原因：${data.error}`);
      }
    } catch (error) {
      alert('網路發生錯誤，請檢查連線。');
    }
    setIsLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center font-sans">
      <div className="text-center mt-12 mb-10">
        <h1 className="text-4xl font-extrabold mb-3 text-green-400 tracking-wider">🏃‍♂️ 香港跑友精選歌單</h1>
        <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
          一人推薦一首你的必備跑曲，湊成最強的香港區跑手專屬 BGM！
        </p>
      </div>

      <div className="w-full max-w-md bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-700">
        <input 
          type="text" 
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="貼上 Spotify 或 Apple Music 連結..." 
          className="w-full p-4 rounded-xl text-gray-900 mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button 
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-green-500 hover:bg-green-600 text-gray-900 font-bold py-4 rounded-xl transition-all active:scale-95 shadow-lg disabled:opacity-50"
        >
          {isLoading ? '上傳中...' : '推薦這首歌 🎵'}
        </button>
      </div>
    </main>
  );
}
