import { Game as PhaserGame } from 'phaser';
import { Boot } from './scenes/Boot';
import { CountdownScene } from './scenes/CountdownScene';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import { OvercookedGame } from './scenes/OvercookedGame';
import { Preloader } from './scenes/Preloader';
import { TransitionScene } from './scenes/TransitionScene';

const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    backgroundColor: '#028af8',
    scene: [
        Boot,
        Preloader,
        MainMenu,
        CountdownScene,
        OvercookedGame,
        GameOver,
        TransitionScene
    ]
};

const StartGame = (parent) => {

    return new Phaser.Game({ ...config, parent });

}

export default StartGame;