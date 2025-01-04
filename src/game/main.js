import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { MainMenu } from './scenes/MainMenu';
import { OvercookedGame } from './scenes/OvercookedGame';
import { Game } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { TransitionScene } from './scenes/TransitionScene';
import Phaser from 'phaser';

const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scene: [
        Boot,
        Preloader,
        MainMenu,
        TransitionScene,
        OvercookedGame,
        Game,
        GameOver
    ]
};

const StartGame = (parent) => {
    return new Phaser.Game({ ...config, parent });
};

export default StartGame;
