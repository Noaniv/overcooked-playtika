import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, 'background');

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
        this.load.setPath('src/game/assets/raw_ingredients/');

        this.load.image('avocado1', 'avocado1.png');
        this.load.image('cheese1', 'cheese1.png');
        this.load.image('meat1', 'meat1.png');
        this.load.image('tomato1', 'tomato1.png');
        this.load.image('tortilla1', 'tortilla1.png');

        this.load.setPath('src/game/assets/prepped_ingredients/');

        this.load.image('avocado2', 'avocado2.png');
        this.load.image('cheese2', 'cheese2.png');
        this.load.image('meat2', 'meat2.png');
        this.load.image('tomato2', 'tomato2.png');
        this.load.image('tortilla2', 'tortilla2.png');

        this.load.setPath('src/game/assets/recipes/');

        this.load.image('burrito_recipe', 'burrito_recipe.png');
        this.load.image('chipsandguac_recipe', 'chipsandguac_recipe.png');
        this.load.image('guacamole_recipe', 'guacamole_recipe.png');
        this.load.image('quessadilla_recipe', 'quessadilla_recipe.png');
        this.load.image('tacos_recipe', 'tacos_recipe.png');

        this.load.setPath('src/game/assets/kitchen_assets/');

        this.load.image('cookingStation', 'cookingStation.png');
        this.load.image('cuttingBoard', 'cuttingBoard.png');
        this.load.image('divider', 'divider.png');
        this.load.image('readyTable', 'readyTable.png');
        this.load.image('sideBar', 'sideBar.png');

        this.load.setPath('src/game/assets/characters/');

        this.load.image('ChefImage', 'ChefImage.jpeg');
        this.load.image('Sous_chefImage', 'Sous_chefImage.jpeg');
    }

    

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('OvercookedGame');
    }
}
