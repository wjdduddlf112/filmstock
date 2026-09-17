"use client";
import { useState } from "react";
import { Copy, Share2 } from "lucide-react";
export function ShareButtons({ title, url }: { title: string; url: string }) {
  const [message, setMessage] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("링크를 복사했습니다.");
    } catch {
      setMessage("링크를 복사하지 못했습니다. 주소창의 주소를 복사해 주세요.");
    }
  }
  async function share() {
    if (!navigator.share) {
      await copy();
      return;
    }
    try {
      await navigator.share({ title: `${title} | FILM STOCK`, url });
      setMessage("");
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError"))
        setMessage("공유하지 못했습니다. 링크 복사를 이용해 주세요.");
    }
  }
  return (
    <div className="share-area">
      <div className="share-buttons">
        <button type="button" className="text-button" onClick={share}>
          <Share2 size={16} />
          공유
        </button>
        <button
          type="button"
          className="icon-button"
          title="링크 복사"
          aria-label="링크 복사"
          onClick={copy}
        >
          <Copy size={18} />
        </button>
      </div>
      <p className="share-status" role="status">
        {message}
      </p>
    </div>
  );
}
