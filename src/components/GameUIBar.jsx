import React from 'react';
import RecipeDisplay from './RecipeDisplay';
import ScoreDisplay from './ScoreDisplay';
import TimerDisplay from './TimerDisplay';
import { MusicToggleButton } from './MusicToggleButton';

const GameUIBar = ({ score, currentRecipe, timeLeft }) => {
  return (
    <div className="fixed left-0 top-0 w-40 h-full bg-gradient-to-b from-orange-900 to-red-900 
                    text-white flex flex-col items-center gap-6 p-4 border-r-4 
                    border-yellow-500 shadow-xl">
      {/* Mexican pattern top border */}
      <div className="absolute top-0 left-0 w-full h-4 bg-yellow-500 flex">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="w-5 h-4 bg-red-600 transform rotate-45 -translate-y-2 translate-x-2" />
        ))}
      </div>

      {/* Recipe Section - Larger and at the top */}
      <div className="mt-8 mb-4">
        <RecipeDisplay currentRecipe={currentRecipe} />
      </div>

      {/* Timer Section */}
      <div className="mt-2">
        <TimerDisplay timeLeft={timeLeft} />
      </div>

      {/* Score Section */}
      <div className="mt-2">
        <ScoreDisplay score={score} />
      </div>

      {/* Music Toggle */}
      <div className="mt-auto mb-8">
        <MusicToggleButton />
      </div>

      {/* Mexican pattern bottom border */}
      <div className="absolute bottom-0 left-0 w-full h-4 bg-yellow-500 flex">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="w-5 h-4 bg-red-600 transform rotate-45 translate-y-2 translate-x-2" />
        ))}
      </div>
    </div>
  );
};

export default GameUIBar;