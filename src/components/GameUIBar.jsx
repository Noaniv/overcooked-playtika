import React, { useState, useEffect } from 'react';
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
        <div style={{
            width: '200px',
            height: '768px',
            backgroundColor: '#8B0000',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
        }}>
            {/* Recipe Section */}
            <div style={{ color: 'white' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>
                    {currentRecipe?.name || 'Waiting for recipe...'}
                </h2>
                <div>
                    <h3>Ingredients:</h3>
                    <ul>
                        {currentRecipe?.ingredients?.map((ingredient, index) => (
                            <li key={index}>{ingredient}</li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Timer */}
            <div style={{ color: 'white' }}>
                <h3>Time Left</h3>
                <div style={{ fontSize: '24px' }}>
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
            </div>

            {/* Score */}
            <div style={{ color: 'white' }}>
                <h3>Score</h3>
                <div style={{ fontSize: '24px' }}>{score}</div>
            </div>

            {/* Music Toggle */}
            <button
                onClick={toggleMusic}
                style={{
                    padding: '10px',
                    fontSize: '24px',
                    cursor: 'pointer',
                    marginTop: 'auto'
                }}
            >
                {isMuted ? '🔇' : '🔊'}
            </button>
        </div>
    );
};

export default GameUIBar;