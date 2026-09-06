import { useState, useEffect } from 'react';

const LiveClock = () => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = dateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = dateTime.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-xl border border-[#E4E6ED] shadow-sm px-4 py-2.5 min-w-[140px] text-center transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#777B84] uppercase tracking-wider">
        <svg className="w-3.5 h-3.5 text-[#2F80C9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Current Time
      </div>
      <div className="text-base font-semibold text-[#3F4147]">{formattedTime}</div>
      <div className="text-xs text-[#92959E]">{formattedDate}</div>
    </div>
  );
};

export default LiveClock;