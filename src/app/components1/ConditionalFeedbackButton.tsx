'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import FeedbackButton from './FeedbackButton';

export default function ConditionalFeedbackButton() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;

      setShowTop(scrollY > 150);
      setShowBottom(scrollY + windowHeight < fullHeight - 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  const isModPage = pathname?.startsWith('/mod') || pathname?.startsWith('/(admin)');
  const isAuth = status !== 'loading' && !!session?.user;

  return (
    <>
      {!isModPage && isAuth && <FeedbackButton />}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-auto">
        {showTop && (
          <button
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-all transform hover:scale-110 border border-red-500/30 cursor-pointer"
            title="Scroll to Top"
          >
            <ArrowUp size={20} />
          </button>
        )}
        {showBottom && (
          <button
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
            className="w-10 h-10 rounded-full bg-[#222] hover:bg-[#333] text-white flex items-center justify-center shadow-lg transition-all transform hover:scale-110 border border-[#444] cursor-pointer"
            title="Scroll to Bottom"
          >
            <ArrowDown size={20} />
          </button>
        )}
      </div>
    </>
  );
}
