import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets/raw_ingredients/');

        this.load.image('avocado1', 'avocado1.png');
        this.load.image('cheese1', 'cheese1.png');
        this.load.image('meat1', 'meat1.png');
        this.load.image('tomato1', 'tomato1.png');
        this.load.image('tortilla1', 'tortilla1.png');

        this.load.setPath('assets/prepped_ingredients/');

        this.load.image('avocado2', 'avocado2.png');
        this.load.image('cheese2', 'cheese2.png');
        this.load.image('meat2', 'meat2.png');
        this.load.image('tomato2', 'tomato2.png');
        this.load.image('tortilla2', 'tortilla2.png');

        this.load.setPath('assets/recipes/');

        this.load.image('burrito_recipe', 'burrito_recipe.png');
        this.load.image('chipsandguac_recipe', 'chipsandguac_recipe.png');
        this.load.image('guacamole_recipe', 'guacamole_recipe.png');
        this.load.image('quessadilla_recipe', 'quessadilla_recipe.png');
        this.load.image('taco_recipe', 'tacos_recipe.png');

        this.load.setPath('assets/meals/');

        this.load.image('guacamole_complete', 'meal1Guacamole.png');
        this.load.image('chipsAndGuac_complete', 'meal5Chipsandguac.png');
        this.load.image('burrito_complete', 'meal4Burrito.png');
        this.load.image('quessadilla_complete', 'meal2Quessadilla.png');
        this.load.image('taco_complete', 'meal3Tacos.png');

        this.load.setPath('assets/kitchen_assets/');

        this.load.image('cookingStation', 'cookingStation.png');
        this.load.image('cuttingBoard', 'cuttingBoard.png');
        this.load.image('divider', 'divider.png');
        this.load.image('readyTable', 'readyTable.png');
        this.load.image('sideBar', 'sideBar.png');
        this.load.image('trash', 'trashCan.png');


        this.load.setPath('assets/characters/');

        this.load.image('ChefImage', 'ChefImage.jpeg');
        this.load.image('Sous_chefImage', 'Sous_chefImage.jpeg');

        this.load.setPath('assets/scenery/');

        this.load.image('logo', 'Logo.png');
        this.load.image('background', 'background.png');
        this.load.image('stations', 'stations.png');
        this.load.image('mainMenuBackground', 'mainMenuBackground.png');

        this.load.setPath('assets/audio/');
        // Load background music only once
        this.load.audio('backgroundMusic', 'Background_Music.mp3');
        this.load.audio('boilingWaterSound', 'boilingwater.mp3');
        this.load.audio('choppingKitchenSound', 'chopping_kitchen.mp3');
        this.load.audio('clockTickingSound', 'clock_ticking.mp3');
        this.load.audio('cookingKitchenSound', 'cooking_kitchen.mp3');
        this.load.audio('drawKnifeSound', 'draw_knife.wav');
        this.load.audio('eatingSound', 'eating_sound.mp3');
        this.load.audio('fallingSound', 'falling_sound.mp3');
        this.load.audio('fightingSound', 'fighting_sound.mp3');
        this.load.audio('flameBurningSound', 'flame_burning.mp3');
        this.load.audio('fryingEggSound', 'frying_egg.mp3');
        this.load.audio('gameCountdownSound', 'game_star_countdown.mp3');
        this.load.audio('goldGameSound', 'gold_game.mp3');
        this.load.audio('pickupSound', 'pickup.wav');
        this.load.audio('sodaSound', 'soda.mp3');
        this.load.audio('trashDisposalSound', 'trash_disposal.mp3');
                
        // Load UI assets
        this.load.setPath('assets/ui/');
        this.load.image('musicOn', 'music-on.png');
        this.load.image('musicOff', 'music-off.png');
    }

    

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        // Initialize game music with proper context
        this.game.music = this.sound.add('backgroundMusic', {
            loop: true,
            volume: 0.5,
            delay: 0
        });

        // Set up music toggle listener
        EventBus.on('toggleMusic', (muted) => {
            console.log('Toggle music event received:', muted);
            try {
                if (!this.sound.locked) {
                    if (muted && this.game.music.isPlaying) {
                        this.game.music.pause();
                    } else if (!muted) {
                        if (this.game.music.isPaused) {
                            this.game.music.resume();
                        } else if (!this.game.music.isPlaying) {
                            this.game.music.play();
                        }
                    }
                    EventBus.emit('musicStateChanged', muted);
                } else {
                    console.log('Audio context is locked, waiting for user interaction');
                    this.sound.once('unlocked', () => {
                        EventBus.emit('toggleMusic', muted);
                    });
                }
            } catch (error) {
                console.error('Error toggling music:', error);
            }
        });

        // Start music only after audio context is ready
        this.sound.once('unlocked', () => {
            console.log('Audio context unlocked');
            if (!this.game.music.isPlaying) {
                this.game.music.play();
                EventBus.emit('musicStateChanged', false);
            }
        });

        // Move to MainMenu
        this.add.image(512, 384, 'mainMenuBackground');
        this.scene.start('MainMenu');
    }

    shutdown() {
        // Clean up event listener when scene shuts down
        EventBus.off('toggleMusic');
    }
}
