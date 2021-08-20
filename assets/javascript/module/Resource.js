/*
New object module
Dependencys: null
*/
define(['module/Global', 'module/HUD', 'module/Controls', 'module/Utils'],
function(Global, HUD, Controls, Utils) {

  var nextResourceId = 0;

    //public functions
    var Resource = function(x, y, type) {
      var id = 'resource:'+type + ":"+nextResourceId;
      nextResourceId++;

        var game = Global.game;
        var level = Global.level;

        //Private variables
        var sprite;
        var amount = 100;
        var SPRITE_SIZE = 32;


        function moveHere(){
            if (game.input.activePointer.leftButton.isDown) return;
            console.log("Click on resource");

            for (var i=0 ; i < Global.selectedUnits[PLAYER_ID].length; i++){
              var unit = Global.selectedUnits[PLAYER_ID][i];
                unit.collect(this);
            }
            //Controls.doNotMove(); //only move with right click

            //TODO stop loop when click on something else
        }

        //preload
        //game.load.image('crystal', 'assets/img/crystal.png');

        // Public functions
       this.create = function() {

          sprite =  game.add.sprite(x, y, 'crystal');
          sprite.width = SPRITE_SIZE; sprite.height = SPRITE_SIZE;
          sprite.inputEnabled = true;

          sprite.events.onInputDown.add(moveHere, this);
          Utils.tintSprite(sprite, type);
        };
        this.update = function(){};

        this.extract = function(){
          amount -= 1;
          if (amount <= 0) {
            //TODO destroy whole object
            sprite.destroy();

            var filterById = function(resource){ return resource.properties().id != id; };
            Global.levelResources[type] = Global.levelResources[type].filter(filterById);
          }
        };

        this.properties = function(){
          return {
            id: id,
            type: type,
            status: status,
            isAlive: sprite.alive,
            x: sprite.x, y: sprite.y,
            amount: amount
          };
        };
        this.setVisible = function(visibility){
          sprite.visible = visibility;
        };

      };

      return {
        new: function(x, y, type){
          var resource = new Resource(x, y, type);
          Global.levelResources[type].push(resource);
          return resource;
        },
      };
});
