/*
New object module
Dependencys: null
*/
define(['module/Global', 'module/HUD', 'module/Unit', 'module/Controls', 'module/Utils', 'module/Dialog'],
function(Global, HUD, Unit, Controls, Utils, Dialog) {

  var nextBuildingId = 0;
    //public functions
    var Building = function(x, y, playerId, type) {
        var game = Global.game;
        var level = Global.level;

        var id = 'building:'+playerId +":"+nextBuildingId;
        nextBuildingId++;

        var SPRITE_SIZE = 64;
        //Private variables
        var sprite;
        var life = 10;
        //preload
        var CREATION_SPEED = 5000;
        var MAX_QUEUE_SIZE = 5;
        var UNIT_COST = 5;

        var creationTimer;
        var queueSizeText ;
        var creationQueue = [];

        var style =  { font: "16px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };


        function createUnit(callback){
          if (!callback) callback = function(){};
          if (Global.resources[playerId][type] < UNIT_COST) {
            console.log("Not enough resources "+ Global.resources[playerId][type] );
            return;
          }

          Global.resources[playerId][type] -= UNIT_COST;
        //  Controls.doNotMove(); //Only move with rightclick
          if (creationQueue.length < MAX_QUEUE_SIZE) creationQueue.push(callback);
          if (creationQueue.length === 1) startCreatingUnit();
          queueSizeText.text = creationQueue.length;

          //Cancel units pathfinding
          //units.forEach(function(unit){unit.stop();});
        }
        function startCreatingUnit(){
          if (playerId === 0) Utils.progressBar(sprite.x-16, sprite.top -17, CREATION_SPEED);
          creationTimer.add(CREATION_SPEED, function(){
            spawnUnit();
          });
          creationTimer.start();
        }

        function spawnUnit(){
          //console.log("Creating unit");
          var randomX = Utils.random(x, x + sprite.width);
          var unit = Unit.new(randomX ,sprite.bottom, playerId, type);
          unit.create();
          if (playerId === PLAYER_ID) Dialog.emoji(x,y, 'born');

          try{
            creationQueue[0](unit);//callback
          } catch(e){}

          creationQueue.shift();
          queueSizeText.text = creationQueue.length;
          if (creationQueue.length > 0) startCreatingUnit();

        }

        // Public functions
       this.create = function() {
          //console.log("Creating build on ", x, y);

          creationTimer = game.time.create(false);

          /*  var bmd = game.make.bitmapData();
          bmd.load('castle');
          bmd.replaceRGB(179,179,179, 255, 250, 0, 0, 255);
            */
          //sprite =  game.add.sprite(x, y, bmd);
          sprite =  game.add.sprite(x, y, 'castle-'+typeToName(type));

          sprite.anchor.setTo(0.5,0.5);
          sprite.width = SPRITE_SIZE;sprite.height = SPRITE_SIZE;
          sprite.inputEnabled = true;

          if (PLAYER_ID ==playerId ){
            sprite.events.onInputDown.add(createUnit);
          }
          Utils.tintSprite(sprite,playerId);

          queueSizeText = game.add.text(sprite.left,sprite.top -20, "", style);

        };
        this.update = function(){
          if (life <= 0 ){
            //TODO destroy whole object
            sprite.destroy();
            creationTimer.stop();
            queueSizeText.text = '';

            Utils.removeBuilding(id, playerId);
            return;
          }

          if (playerId === PLAYER_ID || Global.debug) queueSizeText.text = creationQueue.length;
          else queueSizeText.text = '';
        };

        this.receiveAttack = function(attackerType){
          life -= Utils.damage(attackerType, type);
        };
        this.createUnit = createUnit;
        this.spawnUnit = spawnUnit; //Create without resources or delay (cheat)
        this.properties = function(){
          return {
            id: id,
            type: type,
            status: status,
            isAlive: sprite.alive,
            x: sprite.x, y: sprite.y
          };
        };
        this.setVisible = function(visibility){
          sprite.visible = visibility;
        };

      };

      return {
        new: function(x, y, playerId, type){
          var building = new Building(x, y, playerId, type);
          Global.buildings[playerId].push(building);
          return building;
        },
        preload: function(){
            Global.game.load.image('castle-rock', 'assets/img/castle-paper.png');
            Global.game.load.image('castle-paper', 'assets/img/castle-rock.png');
            Global.game.load.image('castle-scissor', 'assets/img/castle-scissor.png');

        }
      };
});
