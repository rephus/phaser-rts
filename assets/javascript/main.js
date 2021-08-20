var global; //Global variable to use from console (only if debug=True)
requirejs(['module/Global', 'module/Level','module/HUD', 'module/Dialog', 'module/Cheat', 'module/Menu',
'levels/LevelLogic1', 'levels/LevelLogicTest'], //Still needs to be loaded for the sync require below
function(Global, Level,HUD, Dialog, Cheat, Menu){


  var game  = new Phaser.Game(800, 600, Phaser.AUTO, '', { });
  Global.game = game;

  //console.log("main start", game);
    if (Global.debug) global = Global;

     game.state.add('menu', {
        preload: Menu.preload,
        create: Menu.create
     });

     game.state.add('level', {
       preload: function(){
         var levelSelected = require('levels/LevelLogic'+Global.levelName);
         Level.init(levelSelected);
         Level.preload();
       },
       create: function(){
         game.plugins.add(Phaser.Plugin.Debug);
         Level.create();
         game.physics.startSystem(Phaser.Physics.ARCADE);
       } ,
       update: Level.update,
       render: Level.render,
     });

    // Global.levelName = 'Test';
    Global.levelName = '1';
     game.state.start('level'); //TODO remove
     //game.state.start('menu');

});
