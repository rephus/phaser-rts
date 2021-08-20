/*
New object module
Dependencys: null
*/
define(['module/Global'],function(Global) {

  // ------------
  // PRIVATE VARIABLES
  // ---------------
  var progressRender = [];
  var globalDefaults =  JSON.stringify(Global);// Copy by value

  // ------------
  // PRIVATE METHODS
  // ---------------
  var flatten = function(arrayOfArrays) {
    var array = [];
    for (var i = 0; i < arrayOfArrays.length; i++){
      array = array.concat( arrayOfArrays[i]);
    }
    return array;
  };

  function enemyObjects(playerId, listObjects) {
    var objects = [];
    var enemyPlayerIds = Global.enemyPlayerIds[playerId];
    for (var i = 0; i < Global.units.length; i++){ //loop number players
      if (enemyPlayerIds.indexOf(i) != -1) {
          objects = objects.concat(listObjects[i]); //Player i objecs
        }
    }
    return objects;
  }

  // ------------
  // PUBLIC METHODS
  // ---------------
  return {
    random: function(min,max){
        return Math.floor(Math.random()*(max-min+1)+min);
    },
    randomArray: function(array){
      if (array.length > 0 ) {
        var r = this.random(0, array.length - 1);
        return array[r];
      }
    },
    spiral: function  (pos){
          //Solution http://stackoverflow.com/a/14010215
          //Another solution http://stackoverflow.com/questions/398299/looping-in-a-spiral
          var x=0, y=0, dx=0, dy=-1;
          var leg = 0, layer = 1;
          for(var i=0; i < pos; i++){
            switch(leg) {
              case 0: x++; if (x == layer) leg++; break;
              case 1: y++; if (y == layer) leg++; break;
              case 2: x--; if (-x == layer) leg++; break;
              case 3: y--; if (-y == layer) {leg=0; layer++;} break;
            }
          }
          return [x,y];
        },
      distance: function(sprite1, sprite2) {
      //  console.log("SPrite 1, ",sprite1, sprite2);
        return Math.sqrt(Math.pow(sprite1.x - sprite2.x, 2) +
          Math.pow(sprite1.y - sprite2.y, 2));
      },
      closest : function(sprite, sprites) {
        var closestSprite, closestDistance;
        for (var i=0; i < sprites.length; i++){
          var s = sprites[i];
          var distance = this.distance(sprite, s.properties());
        //  console.log("Distance between, ", sprite, s.properties(), distance);
           if (!closestSprite || distance < closestDistance){
             closestDistance = distance;
             closestSprite = s;
           }
        }
        return closestSprite;
      },
      myUnits : function(myPlayer){
        return Global.units[myPlayer];
      },
      mySelectedUnits : function(type){
           function filterByType(object){ return object.properties().type === type; };
          return Global.selectedUnits[PLAYER_ID].filter(filterByType);
      },
      buildings : function(playerId, type){
          function filterByType(object){ return object.properties().type === type; };
          return Global.buildings[playerId].filter(filterByType);
      },
      allUnits: function(){
        return flatten(Global.units);
      },
      allBuildings: function(){
        return flatten(Global.buildings);
      },
      allResources: function(){
        return flatten(Global.levelResources);
      },
      getResource: function(id){
        var allResources = this.allResources();
        for (var j = 0; j < allResources.length ;j++){
          var r = allResources[j];
          if (id == r.properties().id) return r;
        }
        return undefined;
      },
      allies: function(myPlayer){
        var units = [];
        var enemyPlayerIds = Global.enemyPlayerIds[myPlayer];
        for (var i = 0; i < Global.units.length; i++){
          if (enemyPlayerIds.indexOf(i) == -1 && i != myPlayer) {
              var playerUnits = Global.units[i]; //Player i units
              units = units.concat(playerUnits);
            }
        }
        return units;
      },
      enemies: function(playerId){
        return enemyObjects(playerId, Global.units);
      },
      enemyBuildings: function(playerId){
        return enemyObjects(playerId, Global.buildings);
      },
      removeUnit: function(id, playerId) {
        var filterById = function(unit){ return unit.properties().id != id; };

      //  console.log("Removing id " + id + " from player "+playerId+": " + Global.units[playerId].length);
        Global.units[playerId] = Global.units[playerId].filter(filterById);
        Global.selectedUnits[playerId] = Global.selectedUnits[playerId].filter(filterById);
        //console.log("Total units ", Global.units[playerId].length);
      },
      removeBuilding: function(id, playerId) {
        var filterById = function(building){ return building.properties().id != id; };

        Global.buildings[playerId] = Global.buildings[playerId].filter(filterById);
      },
      //Change color depending on player ID
      tintSprite: function(sprite, type){
        switch (type){
            case 0: sprite.tint = 0xaaffaa; break;
            case 1: sprite.tint = 0xffaaaa; break;
            case 2: sprite.tint = 0xaaaaff; break;
            case 3: sprite.tint = 0xffaaff; break;

            default: console.error("Undefined player id "+ type);
        }
      },
      onUnitInArea: function(x, y, w, h, callback/*unit*/, autodestroy){
          //IF any of my player units are inside an area
          if (typeof autodestroy === 'undefined') autodestroy = true;

          var checkTimer = Global.game.time.create(true);
          var rect = new Phaser.Rectangle(x, y, w, h);
          checkTimer.loop(1000, function(){
            for (var i = 0; i <Global.selectedUnits[PLAYER_ID].length; i++){
              var unit = Global.selectedUnits[PLAYER_ID][i];
              if (rect.contains(unit.properties().x, unit.properties().y)){
                console.log("Unit in area " , autodestroy);
                if (autodestroy) checkTimer.destroy();
                callback(unit);
                return;
              }
            }
          });
          checkTimer.start();
      },
      damage: function(attackType, defenseType) {
        var damage = 2; //default (must be multiple of 2)
        //TODO type vars
        if (defenseType === ROCK && attackType == PAPER) damage *=2;
        else if (defenseType == PAPER && attackType == SCISSOR) damage *=2;
        else if (defenseType == SCISSOR  && attackType === ROCK) damage *=2;

        else if (defenseType == PAPER && attackType === ROCK) damage /=2;
        else if (defenseType == SCISSOR && attackType == PAPER) damage /=2;
        else if (defenseType === ROCK  && attackType == SCISSOR) damage /=2;

        return damage;
      },
      textButton: function(x, y , text, callback){
        var game = Global.game;
        var style = { font: "32px Arial", fill: "#ff0000", boundsAlignH: "center", boundsAlignV: "middle" };
        var buttonWidth = 200;
        var buttonHeight = 50;
        var button = game.add.button(x- buttonWidth/2, y, 'button', callback);
        button.width = buttonWidth;
        button.height = buttonHeight;
        var t = game.add.text(x, y , text, style);
        t.setTextBounds(- buttonWidth/2, 10 , buttonWidth, buttonHeight); //Center text in button
      },
      progressBar: function(x, y , miliseconds){
        var width = 32;
        var height = 10;
        var rect = new Phaser.Rectangle(x, y , 0, height);
        var background = new Phaser.Rectangle(x, y, width, height);
        progressRender.push({rect: rect, background: background});

        var steps = 10;
        Global.game.time.events.repeat(miliseconds / steps, steps, function(){
          rect.width += width / steps ;
          background.x = rect.right;
          background.width = width - rect.width;
          //TODO remove from array too
        });
      },
      resetLevel: function(levelName) {
        if (levelName) Global.levelName = levelName;
        // Reset globals
        var defaultSettings = JSON.parse(globalDefaults);
        Object.keys(defaultSettings).forEach(function(key){
          Global[key] = defaultSettings[key];
        });

        Global.game.state.start('level');
      },

      render: function(){
        var game = Global.game;

        //console.log("progressRender ", progressRender);
        progressRender.forEach(function(progress){
          if (progress.background.width > 0.1){
            //console.log("progress.background.width", progress.background.width);
            game.debug.geom(progress.rect, 'rgba(117,213,255,0.5)');
            game.debug.geom(progress.background, 'rgba(23, 74,151,0.5)');
          }
        });
      }

  };
});
