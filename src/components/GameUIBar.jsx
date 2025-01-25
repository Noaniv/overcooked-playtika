import React from 'react';
import { MusicToggleButton } from './MusicToggleButton';

const GameUIBar = ({ score, currentRecipe, timeLeft }) => {
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  // Create a canvas element for the recipe image
  React.useEffect(() => {
    if (currentRecipe && window.game) {
      const texture = window.game.textures.get(currentRecipe.image);
      if (texture) {
        const canvas = document.getElementById('recipe-canvas');
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const frame = texture.getSourceImage();
          ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
        }
      }
    }
  }, [currentRecipe]);

  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: '80px',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '20px 10px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '30px',
      zIndex: 1000,
      boxSizing: 'border-box'
    }}>
      <MusicToggleButton />

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '5px' 
      }}>
        <span style={{ fontWeight: 'bold' }}>Time</span>
        <span style={{ 
          color: '#FFD700',
          fontSize: '20px'
        }}>
          {formatTime(timeLeft)}
        </span>
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '5px' 
      }}>
        <span style={{ fontWeight: 'bold' }}>Score</span>
        <span style={{ 
          color: '#FFD700',
          fontSize: '20px'
        }}>
          {score}
        </span>
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '5px'
      }}>
        <span style={{ fontWeight: 'bold' }}>Recipe</span>
        <div style={{ 
          width: '70px',
          height: '70px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '5px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden'
        }}>
          {currentRecipe ? (
            <canvas 
              id="recipe-canvas"
              width="70"
              height="70"
              style={{
                width: '100%',
                height: '100%'
              }}
            />
          ) : (
            <span>Loading...</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameUIBar; 