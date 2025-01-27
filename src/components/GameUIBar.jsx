import { ChefHat, Music, Star, Timer, Trophy, VolumeX } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { EventBus } from '../game/EventBus';

export default function GameUIBar() {
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

    const getIngredientImage = (ingredientName) => {
        // Convert ingredient name to lowercase and remove spaces for asset naming
        const assetName = `${ingredientName.toLowerCase()}2`;
        return `/assets/prepped_ingredients/${assetName}.png`;
    };

    return (
        <div className="w-64 h-full bg-gradient-to-br from-yellow-600 via-red-500 to-orange-600 flex flex-col p-4 space-y-4 relative overflow-hidden shadow-2xl">
            {/* Mexican pattern overlay */}
            <div className="absolute inset-0 w-full h-full opacity-20" 
                 style={{
                     backgroundImage: `
                         repeating-linear-gradient(45deg, 
                         transparent 0px, 
                         transparent 10px, 
                         rgba(255,99,71,0.3) 10px, 
                         rgba(255,99,71,0.3) 20px),
                         repeating-linear-gradient(-45deg, 
                         transparent 0px, 
                         transparent 10px, 
                         rgba(255,215,0,0.3) 10px, 
                         rgba(255,215,0,0.3) 20px)
                     `
                 }}
            />

            {/* Recipe Card */}
            <div className="relative bg-gradient-to-br from-yellow-800 to-orange-900 rounded-xl p-4 shadow-xl transform hover:scale-105 transition-transform duration-300 border-2 border-yellow-400">
                <div className="absolute -top-3 -right-3 bg-red-500 rounded-full p-2 shadow-lg border-2 border-yellow-300">
                    <ChefHat className="w-6 h-6 text-yellow-100" />
                </div>
                
                <h2 className="text-2xl font-bold text-yellow-100 mb-3 text-center">
                    {currentRecipe?.name || '¡Nueva Receta!'}
                </h2>
                
                <div className="space-y-2">
                    <h3 className="text-lg font-bold text-yellow-200">Ingredientes:</h3>
                    <ul className="grid grid-cols-2 gap-2">
                        {currentRecipe?.ingredients?.map((ingredient, index) => (
                            <li 
                                key={index}
                                className="flex flex-col items-center p-2 rounded-lg 
                                         bg-orange-800 bg-opacity-70 
                                         border border-orange-400 hover:bg-opacity-90 
                                         transition-all duration-300 transform hover:scale-105"
                            >
                                <div className="w-16 h-16 flex items-center justify-center mb-1">
                                    <img 
                                        src={getIngredientImage(ingredient)}
                                        alt={ingredient}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <span className="text-xs font-medium text-yellow-100 text-center">
                                    {ingredient}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Timer Section */}
            <div className="relative bg-gradient-to-br from-green-800 to-emerald-900 rounded-xl p-4 shadow-xl transform hover:scale-105 transition-transform duration-300 border-2 border-green-400">
                <div className="absolute -top-3 -left-3 bg-emerald-500 rounded-full p-2 shadow-lg border-2 border-green-300">
                    <Timer className="w-6 h-6 text-green-100" />
                </div>
                
                <h3 className="text-xl font-bold text-green-100 text-center mb-2">Tiempo</h3>
                <div className="text-4xl font-bold text-yellow-300 text-center tracking-wider bg-gradient-to-r from-green-900 to-emerald-900 rounded-lg p-2">
                    {`${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`}
                </div>
                {timeLeft <= 30 && (
                    <p className="text-red-300 text-center mt-2 animate-pulse font-bold text-sm">¡Rápido Amigo!</p>
                )}
            </div>

            {/* Score Section */}
            <div className="relative bg-gradient-to-br from-blue-800 to-indigo-900 rounded-xl p-4 shadow-xl transform hover:scale-105 transition-transform duration-300 border-2 border-blue-400">
                <div className="absolute -top-3 -right-3 bg-blue-500 rounded-full p-2 shadow-lg border-2 border-blue-300">
                    <Trophy className="w-6 h-6 text-blue-100" />
                </div>
                
                <h3 className="text-xl font-bold text-blue-100 text-center mb-2">Puntos</h3>
                <div className="flex justify-center items-center space-x-2 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-lg p-2">
                    <div className="text-4xl font-bold text-yellow-300">
                        {score}
                    </div>
                    <Star className="w-6 h-6 text-yellow-400 animate-pulse" />
                </div>
            </div>

            {/* Music Toggle */}
            <button
                onClick={toggleMusic}
                className="mt-auto bg-gradient-to-r from-purple-800 to-fuchsia-900 p-3 rounded-xl 
                         shadow-xl border-2 border-purple-400 hover:from-purple-700 hover:to-fuchsia-800 
                         transition-all duration-300 flex items-center justify-center space-x-2 group
                         transform hover:scale-105"
            >
                {isMuted ? (
                    <VolumeX className="w-6 h-6 text-purple-100 transform group-hover:scale-110 transition-transform duration-300" />
                ) : (
                    <Music className="w-6 h-6 text-purple-100 transform group-hover:scale-110 transition-transform duration-300" />
                )}
                <span className="text-purple-100 font-medium text-sm">
                    {isMuted ? 'Sin Música' : 'Con Música'}
                </span>
            </button>
        </div>
    );
}