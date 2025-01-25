import React from 'react';

const TimerDisplay = ({ timeLeft }) => {
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progress = (timeLeft % 60) / 60 * 100;

  return (
    <div className="flex flex-col items-center gap-2 bg-gradient-to-r 
                    from-green-900 to-green-800 p-4 rounded-xl border-2 
                    border-green-500 w-32 transform hover:scale-105 
                    transition-transform duration-300">
      <span className="font-bold text-green-300">Tiempo</span>
      
      {/* Circular timer display */}
      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Background circle */}
        <svg className="absolute w-full h-full -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="rgba(34, 197, 94, 0.2)"
            strokeWidth="4"
          />
          {/* Progress circle */}
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="#fde047"
            strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 28}`}
            strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
            className="transition-all duration-1000"
          />
        </svg>
        
        {/* Time display */}
        <span className="text-xl font-bold text-yellow-300 font-mono z-10">
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Time warning indicator */}
      {timeLeft <= 30 && (
        <span className="text-red-400 text-sm animate-pulse">
          ¡Date prisa!
        </span>
      )}
    </div>
  );
};

export default TimerDisplay;