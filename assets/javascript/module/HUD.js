/*
HUD module
Dependency: null
*/
define(['module/Global', 'module/Utils', 'module/Controls'],
 function(Global, Utils,Controls) {

    //Private variables
    var game;
    var style =  { font: "32px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };

    var resourceTexts;
    var createBuildings = [];

    var MINIMAP_WIDTH = 100;
    var MINIMAP_HEIGHT = 100;

    var mapSizeX = 1, mapSizeY = 1;

    var MINIMAP_X , MINIMAP_Y;
  //  var minimapBase;
    var minimapUnits;

    var shadowTexture, lightSprite;

    function fullScreenToggle(){
      if (game.scale.isFullScreen) game.scale.stopFullScreen();
      else game.scale.startFullScreen(false);

    }
    function createResources(){
      for (var type=0; type < UNIT_TYPES; type++){
        var x = game.camera.width-250 + (type * 70);
        var y = 10;
        resourceTexts.push(game.add.text(x + 30,y,  "0", style) );
        resourceTexts[type].fixedToCamera = true;
        var sprite = game.add.sprite(x , y, 'crystal');
        sprite.fixedToCamera = true;
        sprite.width = 32; sprite.height = 32;
        Utils.tintSprite(sprite, type);

      }
    }
    function createMinimap(){
      var miniMapBmd = game.add.bitmapData(MINIMAP_WIDTH , MINIMAP_HEIGHT ); // g_game.miniMapSize is the pixel size in the minimap
      var map = Global.map;
      //TODO mapsize relative to map width, in order to fit the whole map in MINIMAP_WIDTH*H
      mapSizeX = MINIMAP_WIDTH/ map.width;
      mapSizeY = MINIMAP_HEIGHT/ map.height;
    //  console.log("Map size ", map.width , map.height, mapSizeX, mapSizeY);
      //Create minimap base with terrain info from map
      // iterate my map layers
      //for (l = 0; l < g_game.tileMap.layers.length; l++) { //only 1 layer
          for (y = 0; y < map.height; y++) {
              for (x = 0; x < map.width; x++) {
                  var tile = map.getTile(x, y/*, l*/);
                  //console.log("TILE ", tile);
                  if (tile /*&& g_game.tileMap.layers[l].name == 'Ground'*/) { //only 1 layer
                      //Minimap colouring
                      switch (tile.index){
                        case 98:  miniMapBmd.ctx.fillStyle = '#00b200'; break;
                        case 102: miniMapBmd.ctx.fillStyle = '#007f00';  break;
                        default: miniMapBmd.ctx.fillStyle = '#7f7f7f';
                      }
                      //miniMapBmd.ctx.fillStyle = '#bc8d6b';// fill a pixel in the minimap
                      miniMapBmd.ctx.fillRect(x * mapSizeX, y * mapSizeY, mapSizeX, mapSizeY);
                  }
              }
          }
        //}
        var minimapBase = game.add.sprite(MINIMAP_X, MINIMAP_Y, miniMapBmd); // dynamic bmd where I draw mobile stuff like friends and enemies g_game.miniMapOverlay = this.game.add.bitmapData(g_game.tileMap.width*g_game.miniMapSize, g_game.tileMap.height*g_game.miniMapSize);this.game.add.sprite(g_game.miniMap.x, g_game.miniMap.y, g_game.miniMapOverlay);
        minimapBase.fixedToCamera = true;

        //Create new bitmap for drawing units
        minimapUnits = game.add.bitmapData(MINIMAP_WIDTH , MINIMAP_HEIGHT);
        var minimapUnitSprite = game.add.sprite(MINIMAP_X, MINIMAP_Y, minimapUnits);
        minimapUnitSprite.fixedToCamera = true;

    }
    function drawMinimap (){

      minimapUnits.context.clearRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);
      var pixelSize = 2;

      var enemies = Global.enemyPlayerIds[0];

      //TODO loop over myUnits, show only visible units on map
      Utils.allUnits().forEach(function(unit){

        var prop = unit.properties();
        var playerColor;
        if (prop.player == PLAYER_ID) playerColor = '#00ff00';
        else if (enemies.indexOf(prop.player) != -1)playerColor = '#ff0000';
        else playerColor = '#0000ff';

        var x = Math.floor(prop.x / Global.map.tileWidth);
        var y = Math.floor(prop.y / Global.map.tileHeight);
        minimapUnits.rect(x * mapSizeX, y * mapSizeY, pixelSize * mapSizeX, pixelSize* mapSizeY, playerColor);
      });
      minimapUnits.dirty = true;

    /*  g_game.soldiers.forEach(function(soldier) {
         g_game.miniMapOverlay.rect(Math.floor(soldier.x / TILE_SIZE) * g_game.miniMapSize, Math.floor(soldier.y / TILE_SIZE) * g_game.miniMapSize, g_game.miniMapSize, g_game.miniMapSize, color);
       });
*/
    }

    function updateEnemyVisibility(){
      //TODO optimize function, bit too heavy
      var enemies = Utils.enemies(PLAYER_ID);
      var resources = Utils.allResources();
      var buildings = Utils.enemyBuildings(PLAYER_ID);

      function setVisible(object){object.setVisible(true);}

      if (Global.visibleMap){

        enemies.forEach(setVisible);
        resources.forEach(setVisible);
        buildings.forEach(setVisible);
        return;
      }

        //Set all to false
        function setInvisible(object){object.setVisible(false);}
        enemies.forEach(setInvisible);
        resources.forEach(setInvisible);
        buildings.forEach(setInvisible);

        //Set enemies to true if visible
        function setVisibleIfClose(object) {
            var unit = this;
            var distance = Utils.distance(object.properties(), unit);
            //console.log("Set object ", object, unit,  "visible", distance);
            if (distance < unit.viewRange) object.setVisible(true);
        }

        function setEnemiesVisible(myUnitProperties) {
            enemies.forEach(setVisibleIfClose, myUnitProperties);
            resources.forEach(setVisibleIfClose, myUnitProperties);
            buildings.forEach(setVisibleIfClose, myUnitProperties);
        }

        Global.units[PLAYER_ID].forEach(function(unit){
          setEnemiesVisible(unit.properties());
        });
    }


    function updateShadowTexture() {
        //TODO optimize function, bit too heavy
        if (Global.visibleMap){

          shadowTexture.context.fillStyle = 'rgb(255, 255, 255)';
          shadowTexture.context.fillRect(0, 0, game.width, game.height);
          shadowTexture.dirty = true;

          return;
        }

        // Draw shadow
        shadowTexture.context.fillStyle = 'rgb(220, 220, 220)';
        shadowTexture.context.fillRect(0, 0, game.width, game.height);

        lightSprite.x = -game.world.x;
        lightSprite.y = -game.world.y;

        // Intensity and size  of light fade every interval
        var lightFadeAmount = 20;
        var lightFadeSize = 10;
        // Draw circle of light

        for (var i = 0; i < Global.units[PLAYER_ID].length; i++) {
            var unit = Global.units[PLAYER_ID][i].properties();

            /*Fade DOESN'T WORK
            for (var r =0 ; r < 6; r++){
              var c = 1+( r *lightFadeAmount) ;
              shadowTexture.context.fillStyle = 'rgba('+c+', '+c +', '+c+', '+c+')';
              shadowTexture.context.beginPath();
              var viewRange = unit.viewRange + 50 - r* lightFadeSize;
              shadowTexture.context.arc(unit.x+game.world.x, unit.y+game.world.y, viewRange , 0, Math.PI*2);
              shadowTexture.context.fill();
            }*/
            //var discrete = 10;
            //var x = parseInt((unit.x + game.world.x) / discrete ) * discrete;
            //var y = parseInt((unit.y + game.world.y) / discrete ) * discrete;
            var x = unit.x + game.world.x;
            var y = unit.y + game.world.y;
            shadowTexture.context.fillStyle = 'rgba(255, 255, 255, 200)';
            shadowTexture.context.beginPath();
            shadowTexture.context.arc(x, y , unit.viewRange, 0, Math.PI * 2);
            shadowTexture.context.fill();
        }
        // This just tells the engine it should update the texture cache
        shadowTexture.dirty = true;
    }

    function updateSelectedUnitBuildings(){
      for (var type=0; type < UNIT_TYPES; type++){
          var typeUnits =  Utils.mySelectedUnits(type);
          createBuildings[type].visible = typeUnits.length > 0;
          //TODO set disabled, not invisible and disable click
        }
    }

    //Public functions
    return{
        init: function() {
          resourceTexts = [];
          game = Global.game;
          MINIMAP_X = game.camera.width - MINIMAP_WIDTH - 10;
          MINIMAP_Y = game.camera.height - MINIMAP_HEIGHT - 10;

        },
        preload: function() {
          game.load.image('crystal', 'assets/img/crystal-white.png');
          game.load.image('fullscreen', 'assets/img/fullscreen.png');
        },

        create: function() {
          createResources();
          createMinimap();
          //full screen stuff
          game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
          game.scale.refresh();

          shadowTexture = game.add.bitmapData(game.width, game.height);
          lightSprite = game.add.image(0, 0, shadowTexture);
          lightSprite.blendMode = Phaser.blendModes.MULTIPLY;
          /*console.log("Blend modes ", Phaser.blendModes);
          game.time.events.loop(5000, function(){
            lightSprite.blendMode += 1;
          });*/

          // TODO use sprite instead of button
          var button = game.add.button(10, 10, 'fullscreen', fullScreenToggle);
          button.fixedToCamera = true;

          // Use sprites instead of buttons to take advantage of PriorityID
          //game.add.button(10, game.camera.height - 42, 'building', Controls.placeBuilding);
          for (var type = 0; type < UNIT_TYPES; type++){
            var build = game.add.sprite(10 + (type * 32), game.camera.height - 42, 'castle-'+typeToName(type));
            build.width=32; build.height=32;
            build.inputEnabled = true;
            build.events.onInputDown.add(Controls.clickBuilding );
            build.type = type; //Used in clickBuilding
            build.visible = false;

            build.fixedToCamera = true;
            //Utils.tintSprite(build, type);
            createBuildings.push(build);
          }
          //TODO Only show this when selected unit
          //TODO different building types

          //Update resource texts
          game.time.events.loop(1000, function(){
            resourceTexts.forEach(function(rt, index){
              rt.text = Global.resources[PLAYER_ID][index];
            });
          });

          //Not as heavy as using the update
          game.time.events.loop(200, updateSelectedUnitBuildings);
          if (!Global.visibleMap) game.time.events.loop(100, updateShadowTexture);
          if (!Global.visibleMap) game.time.events.loop(100, updateEnemyVisibility);

          game.time.events.loop(100, drawMinimap);

        //  build.priorityID = 20;
        },
        render: function(){
        //  drawMinimap();
        }

    };
});
