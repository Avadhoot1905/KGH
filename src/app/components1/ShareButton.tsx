"use client";

type ShareButtonProps = {
  title: string;
  url: string;
  className?: string;
};

export default function ShareButton({ title, url, className = "outline" }: ShareButtonProps) {
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        alert("Link copied to clipboard");
      }
    } catch {
      // ignore
    }
  };

  return (
    <button className={className} onClick={handleShare}>🔗 Share</button>
  );
}


