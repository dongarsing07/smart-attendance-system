import { useState, useEffect } from 'react';

const LiveClock = () => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="glass-card p-4 mb-6 text-center">
      <div className="text-3xl font-bold text-blue-400">
        {dateTime.toLocaleTimeString()}
      </div>
      <div className="text-gray-300 mt-1">
        {dateTime.toLocaleDateString(undefined, { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </div>
    </div>
  );
};

export default LiveClock;