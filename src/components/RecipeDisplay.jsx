import React, { useEffect } from 'react';

const RecipeDisplay = ({ currentRecipe }) => {
  useEffect(() => {
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
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: '5px'
    }}>
      <span style={{ fontWeight: 'bold' }}>Recipe</span>
      <div style={{ 
        width: '100px',  // Increased size
        height: '100px', // Increased size
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
            width="100"  // Increased size
            height="100" // Increased size
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
  );
};

export default RecipeDisplay; 