import React from 'react';

const ScoreDisplay = ({ score }) => {
  return (
    <div className="flex flex-col items-center gap-2 bg-gradient-to-r 
                    from-red-900 to-red-800 p-4 rounded-xl border-2 
                    border-red-500 w-32 transform hover:scale-105 
                    transition-transform duration-300">
      <div className="relative w-full">
        <span className="font-bold text-red-300 block text-center">Puntos</span>
        {/* Decorative elements */}
        <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-400 rounded-full" />
        <div className="absolute -right-1 -top-1 w-2 h-2 bg-red-400 rounded-full" />
      </div>
      
      <span className="text-3xl font-bold text-yellow-300 font-mono relative">
        {score.toLocaleString()}
        <span className="absolute -top-1 -right-2 text-xs text-yellow-500">★</span>
      </span>
      
      {/* Score milestone indicator */}
      <div className="w-full h-1 bg-red-950 rounded-full overflow-hidden mt-1">
        <div 
          className="h-full bg-gradient-to-r from-yellow-500 to-red-500"
          style={{ width: `${Math.min((score % 1000) / 10, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default ScoreDisplay;