import { ChefHat, Music, Star, Timer } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { EventBus } from '../game/EventBus';

const GameUIBar = () => {
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(120);
    const [currentRecipe, setCurrentRecipe] = useState(null);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        const handleScore = (newScore) => setScore(newScore);
        const handleTime = (newTime) => setTimeLeft(newTime);
        const handleRecipe = (recipe) => setCurrentRecipe(recipe);

        EventBus.addListener('score-updated', handleScore);
        EventBus.addListener('time-updated', handleTime);
        EventBus.addListener('recipe-updated', handleRecipe);

        return () => {
            EventBus.removeListener('score-updated', handleScore);
            EventBus.removeListener('time-updated', handleTime);
            EventBus.removeListener('recipe-updated', handleRecipe);
        };
    }, []);

    const toggleMusic = () => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);
        EventBus.emit('toggleMusic', newMutedState);
    };

    return (
        <div className="w-64 h-[768px] bg-gradient-to-b from-yellow-600 via-red-700 to-red-900 flex flex-col relative overflow-hidden">
            {/* Decorative Pattern Overlay */}
            <div className="absolute inset-0 opacity-5 bg-repeat"
                style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='%23FFFFFF'/%3E%3C/svg%3E\")",
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Content Container - Fixed Height */}
            <div className="relative z-10 p-6 flex flex-col h-full">
                {/* Title Banner - Fixed Height */}
                <div className="bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 -mx-6 -mt-6 p-4 shadow-lg border-b-4 border-red-800 relative">
                    <div className="absolute inset-0 bg-repeat-x opacity-10"
                        style={{
                            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10L10 0L20 10L10 20Z' fill='%23000000'/%3E%3C/svg%3E\")"
                        }}
                    />
                    <h1 className="text-2xl font-bold text-red-900 text-center font-serif relative">
                        <ChefHat className="inline-block w-6 h-6 mr-2 mb-1" />
                        ¡Together We Taco!
                    </h1>
                </div>

                {/* Recipe Section - Scrollable with Fixed Height */}
                <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl shadow-lg border-2 border-yellow-500 transform hover:scale-102 transition-transform duration-300 mt-6 flex-shrink-0 h-[300px]">
                    <div className="bg-red-800 p-2 rounded-t-lg">
                        <h2 className="text-xl font-bold text-yellow-400 text-center">
                            {currentRecipe?.name || '¡Próxima Receta!'}
                        </h2>
                    </div>
                    <div className="p-4 overflow-y-auto max-h-[240px] scrollbar-thin scrollbar-thumb-red-800 scrollbar-track-yellow-200">
                        <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2 sticky top-0 bg-yellow-100 py-2">
                            <span className="text-2xl">🌮</span> Ingredientes:
                        </h3>
                        <ul className="space-y-2 mt-2">
                            {currentRecipe?.ingredients?.map((ingredient, index) => (
                                <li key={index} 
                                    className="flex items-center gap-2 text-red-700 bg-yellow-50 p-2 rounded-lg border border-yellow-300 transform hover:scale-102 transition-transform duration-200">
                                    <span className="text-yellow-600 text-xl">•</span>
                                    {ingredient}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Timer Section - Fixed Height */}
                <div className="bg-gradient-to-br from-red-800 to-red-900 rounded-xl p-4 shadow-lg border-2 border-yellow-500 transform hover:scale-102 transition-transform duration-300 mt-6 flex-shrink-0">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Timer className="w-6 h-6 text-yellow-400" />
                        <h3 className="text-lg font-bold text-yellow-400">Tiempo</h3>
                    </div>
                    <div className="relative">
                        <div className="h-2 bg-red-950 rounded-full mb-2">
                            <div 
                                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-1000"
                                style={{ width: `${(timeLeft / 120) * 100}%` }}
                            />
                        </div>
                        <div className="text-3xl font-bold text-yellow-300 text-center font-mono">
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </div>
                    </div>
                </div>

                {/* Score Section - Fixed Height */}
                <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl p-4 shadow-lg border-2 border-yellow-500 transform hover:scale-102 transition-transform duration-300 mt-6 flex-shrink-0">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Star className="w-6 h-6 text-yellow-300" />
                        <h3 className="text-lg font-bold text-yellow-300">Puntos</h3>
                    </div>
                    <div className="text-4xl font-bold text-yellow-300 text-center font-mono relative">
                        <span className="relative">
                            {score}
                            <span className="absolute -top-1 -right-4 text-lg text-yellow-400">★</span>
                        </span>
                    </div>
                </div>

                {/* Music Toggle - Fixed at Bottom */}
                <button
                    onClick={toggleMusic}
                    className="mt-auto mb-6 mx-auto bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 
                             hover:to-red-800 text-yellow-400 p-4 rounded-full shadow-lg border-2 
                             border-yellow-500 transition-all duration-300 hover:scale-110 
                             focus:outline-none focus:ring-2 focus:ring-yellow-500 flex-shrink-0"
                >
                    <div className="relative">
                        <Music className={`w-8 h-8 transition-transform duration-300 transform 
                                      ${isMuted ? 'scale-90 opacity-50' : 'scale-100'}`} />
                        {isMuted && (
                            <div className="absolute top-1/2 left-1/2 w-0.5 h-10 bg-yellow-400 
                                          -translate-x-1/2 -translate-y-1/2 rotate-45 transform origin-center" />
                        )}
                    </div>
                </button>
            </div>

            {/* Bottom Decorative Border */}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-yellow-500 via-red-500 to-yellow-500" />
        </div>
    );
};

export default GameUIBar;