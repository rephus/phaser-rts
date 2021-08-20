define(['module/Global', 'module/Utils', 'module/Dialog',  'module/Resource', 'module/Unit', 'module/Building', 'module/HUD'],
function(Global, Utils, Dialog, Resource, Unit, Building, HUD) {
  console.log("Loaded level Test");

    return {
        map: 'assets/tilemaps/rpg-green.json',
        preload: function(){},
        create: function(){

          Global.walkables = [134]; //sprites that we allow walking

          //Test onunitarea
        /*  Utils.onUnitInArea(91,106, 56,107, function(unit){
            var unitPos = unit.properties();
            Dialog.emoji(unitPos.x, unitPos.y, 'stop');
          });*/

          Global.ai = true;
          Global.visibleMap = true;

          //Create some random resources somewhere
        /*  var map = Global.map;
          var mapRectangle = new Phaser.Rectangle(0, 0, map.width * global.tileSize, map.height * global.tileSize);
          var point = new Phaser.Point();
          for (var i =0 ; i < 100; i++){
            var type = Utils.random(0, 2);

            mapRectangle.random(point);
            point.floor();
            Global.levelResources[type].push(new Resource.new(x, y , type));

          }*/

        // TEst random generating resources
          /*for ( var type =0 ; type < UNIT_TYPES; type++){
            Resource.new(1000 + (32*type), 1000 , type);
            Resource.new(100 + (32*type), 1000 , type);
            Resource.new(1400 + (32*type),100 , type);
            Resource.new(1400 + (32*type),1400 , type);
          }*/

        },
        start: function(){
          /*
          Test dialog box
          s = 'abc hijklm no';
          for (var i=0; i < 5; i++) {
            x += s;
            Dialog.new(200 + i *300, 200 , x);
          }
          */
        },
        update: function(){

          if (Global.units[0].length === 0 || Global.units[1].length === 0) {
            Global.status = "game_over";
            var win = Global.units[1].length === 0; //Enemy is defeated
            Dialog.gameOver(win, Utils.resetLevel);
          }

        },

        render: function(){}
    };
});
