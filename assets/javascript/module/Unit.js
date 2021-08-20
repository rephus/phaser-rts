/*
New object module
Dependencys: null
*/
define(['module/Global', 'module/Utils', 'module/HUD', 'module/Dialog'],
 function(Global, Utils, HUD, Dialog) {

  var easystar = new EasyStar.js();

  var SPRITE_SIZE = 32;

  var SPEED=200;
  var ATTACK_RANGE = 50;
  var ATTACK_SPEED = 1000; //perform attack ever X MS
  var MAX_LIFE = 10;
  var MAX_RESOURCE = 5;
  var COLLECTION_SPEED = 500; // collect every x MS
  var BUILDING_SPEED = 5000; // finish building in x MS

  var VIEW_RANGE = 300;

  var IDLE = "idle";
  var WALKING = "walking";
  var ATTACKING = "attacking";
  var DEAD = "dead";
  var COLLECTING = "collecting";
  var BUILDING = "building";

  var nextUnitId = 0;

  var Unit = function(x, y, playerId, type){
    //Private variables
    var id = 'unit:'+playerId +":"+nextUnitId;
    nextUnitId++;

    var game = Global.game;
    var level = Global.level;
    var pathfinder = game.plugins.add(Phaser.Plugin.PathFinderPlugin);

    var sprite;

    //  PATHFINDING

    var previousPath = [] ; // to remove debug
    var endPathCallback ;
    var blocked;  // to avoid making 2 requests at pathfinding

    var status = IDLE;
    var actionTimer;
    var attackingEnemy;

    var life = MAX_LIFE;
    var lifeRect, lifeRectBackground;

    var collectingResource;
    var resourceAmount = 0;

    var building;

    var direction = "down";
    var overrideMove = false;

    /// -----------------
    /// BUILD
    // ----------------------
    function startBuilding(){
      status = BUILDING;

      if (playerId === PLAYER_ID) Utils.progressBar(sprite.left, sprite.y - 32, BUILDING_SPEED);
      actionTimer.add(BUILDING_SPEED, function(){
         // Finish building
         require([ 'module/Building'], function(Building){
           var newBuilding = Building.new(building.x, building.y, playerId, type);
           newBuilding.create();
           Global.resources[playerId][type] -= BUILDING_COST;
           status = IDLE;
           if (playerId === PLAYER_ID)Dialog.emoji(sprite.x, sprite.y, 'build');
           sprite.y -= 48; //move unit sprite up a bit

         });
      });
      actionTimer.start();

    }
    // --------------------
    // RESOURCE COLLECTION
    // ------------------
    function doNotMove(){
      overrideMove = true;
      game.time.events.add(100, function(){
         overrideMove = false;
      });
    }

    function collectResource(resource){
        //console.log("Collecting resource ", resource);
        collectingResource = resource;
        findPathTo(resource.properties().x, resource.properties().y, function(){
            if (resource.properties().type == type) startCollecting();
            else console.log("Can't collect different resource type ", resource.properties().type , type);
        });
        doNotMove(); //Override move


      }
    function dropResource(){
      //Drop resources
      actionTimer.stop();

      var closestBuilding = Utils.closest(sprite, Utils.buildings(playerId, type)); //might return undefined
      if (closestBuilding) findPathTo(closestBuilding.properties().x, closestBuilding.properties().y, function(){
          Global.resources[playerId][type] += resourceAmount;
          resourceAmount = 0;
          collectResource(collectingResource); //Go back to extract
      });
    }

    function startCollecting(){

      if (collectingResource.properties().amount <=  0) {
        console.log("Resource depleted");

        //Find close resource and get it
        resources = inView('resources').filter(function(r){return r.properties().type == type;});

        if (resources.length > 0 ) collectResource(resources[0]);
        else {
          if (playerId === PLAYER_ID) Dialog.emoji(sprite.x, sprite.y, 'waiting');
          status = IDLE;
        }
        return;
      }
      if (playerId === PLAYER_ID)Dialog.emoji(sprite.x, sprite.y, 'collect');

      status = COLLECTING;

      if (playerId === PLAYER_ID) Utils.progressBar(sprite.left, sprite.y - 32, COLLECTION_SPEED* MAX_RESOURCE);

      actionTimer.loop(COLLECTION_SPEED, function(){
        if (resourceAmount >= MAX_RESOURCE || collectingResource.properties().amount <= 0) {
          //TODO cancel progressbar
           dropResource();
        } else {
          resourceAmount++;
          collectingResource.extract();
        }
      });
      actionTimer.start();
    }
    // ---------------------------
    // ATTACK AND AI
    // -----------------------------
    function inView(type){
      if (!type) type = 'enemies';//default
      //Return everything that is in view
      var objects = [];
      var inview = [];
      switch(type){
        case 'enemies': objects = Utils.enemies(playerId); break;
        case 'resources': objects = Utils.allResources(); break;
        case 'allies': objects = Utils.allies(playerId); break;
        case 'buildings': throw new Exception("buildings not defined in inView method");
      }

      objects.forEach(function(object){
        var distance = Utils.distance(object.properties(), sprite);
        if (distance < VIEW_RANGE) {
          //console.log("Found " + type + " dinstace from " + object.properties().id+ "to " + id + " : " +  parseInt(distance) );
          inview.push(object);
        }
      });
      //console.log("Things on view " ,  inview);
      return inview;
    }
    function updateLife(){
      //Update life rectangle
      lifeRect.x = sprite.left;
      lifeRect.y = sprite.bottom;
      lifeRect.width = sprite.width / (MAX_LIFE / life);
      // Complete size bar with red life background (-width)
      // We can't overlap a rectangle with another without mixing their colors (right?)
      lifeRectBackground.x = sprite.right ;
      lifeRectBackground.y = sprite.bottom;
      lifeRectBackground.width = lifeRect.width - sprite.width;
    }
    function attack (enemy) {
      attackingEnemy = enemy;
      //console.log("Start attack enemy ", sprite.x, sprite.y , attackingEnemy.properties().x, attackingEnemy.properties().y);

      status = ATTACKING;
      sprite.animations.play('attack');

      actionTimer.loop(ATTACK_SPEED, function(){

        // Check if still in range
        if (attackingEnemy) {
          var distance = Utils.distance(attackingEnemy.properties(), sprite);
          if (distance > ATTACK_RANGE || !attackingEnemy.properties().isAlive) {
            actionTimer.stop();
            sprite.animations.play('stand');
            status = IDLE;
            attackingEnemy = undefined;
            return;
          }
        }
        attackingEnemy.receiveAttack(type);
      });
      actionTimer.start();
    }
    function closestEnemyUnit() {
      // Can't attack while walking
      if (status != IDLE ) return false;
      var distance = 0;

      // TODO attack weak unit in range,  (not closest)
      var enemies = Utils.enemies(playerId);
      var closestEnemy = Utils.closest(sprite, enemies);
      if (closestEnemy) {
        distance = Utils.distance(closestEnemy.properties(), sprite);
        if (distance < ATTACK_RANGE) {
          attack(closestEnemy);
          return;
        }
      }
      //If not enemy unit in range, check enemy buildings
      var enemyBuildings = Utils.enemyBuildings(playerId);
      var closestEnemyBuilding = Utils.closest(sprite, enemyBuildings);
      if (closestEnemyBuilding) {
        distance = Utils.distance(closestEnemyBuilding.properties(), sprite);
        if (distance < ATTACK_RANGE) attack(closestEnemyBuilding);
      } else {
        //With no building, move back to IDLE
        status = IDLE;
      }

    }
    //TODO function stopDoingThings // attack, move, stop

    function setDirection(path){
      if (path.length > 0){
        var tileSize = Global.map.tileWidth;

          var x = path[0].x *tileSize;
          var y = path[0].y*tileSize;

          if (sprite.x < x) { //going right
            if (sprite.y < y ){ //going up
               direction = (Math.abs(sprite.x - x) < Math.abs(sprite.y - y))?'down':'right';
            } else {
              direction = (Math.abs(sprite.x - x) < Math.abs(sprite.y - y))?'up':'right';
            }
          }else { //going left
            if (sprite.y < y ){ //going up
               direction = (Math.abs(sprite.x - x) < Math.abs(sprite.y - y))?'down':'left';
            } else {
              direction = (Math.abs(sprite.x - x) < Math.abs(sprite.y - y))?'up':'left';
            }
          }
      }
    }
    // ---------------------------
    // MOVEMENT
    // -----------------------------
    function moveTo(path) {
      var tileSize = Global.map.tileWidth;

        var x = path[0].x *tileSize;
        var y = path[0].y*tileSize;
        //console.log("Moving sprite from " + sprite.x+"x"+ sprite.y+ " to "+x+"x"+ y );
        game.physics.arcade.moveToXY(sprite, x, y, SPEED);
        sprite.animations.play('walk-'+direction);
        status = WALKING;

        // If we reached the properties, we remove from the path and keep going
        if (Math.abs(sprite.x-x) < tileSize /2 && Math.abs(y-sprite.y) < tileSize/ 2) {
          level.debugTile(path[0].x, path[0].y, false);
          path.shift(); //previousPath.splice(0,1 );
          setDirection(path);
        }

        // Reached end path
        if (path.length === 0) {
          //console.log("Reached end path "+ x +"x"+ y);
          sprite.body.velocity.x = 0; sprite.body.velocity.y = 0;
          status = IDLE;
          sprite.animations.play('stand');

          if (endPathCallback) endPathCallback();
        }
    }
    function findPathTo(x, y, callback) {
        if (overrideMove) {
          if (!endPathCallback) console.warn("movement is overrided!, but there is no callback (collectResource)");
          return;
        }
          ///  console.log("Moving unit with callback " , callback);
        //console.log("Find path to " + x, y);
        var xy = level.worldToTile(x, y);
        var tilex = xy[0];
        var tiley = xy[1];
        endPathCallback = callback;
        blocked = true;

        actionTimer.stop(); //Stop doing any other action
        // TODO Remove progress bar too

        var iterations = 0; //Increment this value looking for a closer valid path

        pathfinder.setCallbackFunction(function(path) {
          // Retry path if not defined,
          // trying to locate the closest point using the spiral algorithm
          if(!path) {
            iterations++;
            xy = Utils.spiral(iterations);
            //console.log("Path spiral "+i+": "+ xy);
            try{
              pathfinder.preparePathCalculation(level.worldToTile(sprite.x, sprite.y), [tilex+ xy[0],tiley + xy[1]]);
            } catch (e){
              console.log("Mute pathfinding error: "+e);
            }
            pathfinder.calculatePath();
            return;
          }
            path = path || [];

            //Debug tiles // tilemap raycast https://github.com/photonstorm/phaser-examples/blob/master/examples/tilemaps/tilemap%20ray%20cast.js
            level.debugPath(path, true);

            blocked = false; // We unlock this method, so it can run again
            previousPath = path; //Once set, sprite will move along the path
            setDirection(path);

        });

        // Before we start a new path, we clean the debug and set velocity to 0
        level.debugPath(previousPath, false);

        sprite.body.velocity.x = 0;
        sprite.body.velocity.y = 0;

        //console.log("Finding path from " + worldToTile(sprite.x, sprite.y) + " to " + tilex+","+tiley);
        pathfinder.preparePathCalculation(level.worldToTile(sprite.x, sprite.y), [tilex,tiley]);
        pathfinder.calculatePath();
    }

    // ----------------------
    // public functions
    // -------------------------

        this.create = function() {
          // Pathfinding creation
          pathfinder.setGrid(Global.map.layers[0].data, Global.walkables);
          pathfinder._easyStar.enableDiagonals();

        /*  var bmd = game.make.bitmapData();
          bmd.load('player');
          //bmd.key = 'stand/001.png';
          bmd.replaceRGB(255,255,255, 255, 250, 0, 0, 255);
*/
          //sprite = game.add.sprite(x, y, bmd);
          //console.log("sprite.animations._frameData" , sprite.animations._frameData);
          //TODO FIx bitmap with animations
          //  sprite.frameName = 'stand/001.png';
             //var frameNames = Phaser.Animation.generateFrameNames('stand/', 1, 1, '.png', 3);

          switch(type){
            case 0: sprite = game.add.sprite(x, y, 'player'); break;
            case 1: sprite = game.add.sprite(x, y, 'enemy'); break;
            case 2: sprite = game.add.sprite(x, y, 'enemy2'); break;
          }

           sprite.anchor.setTo(0.5,0.5);

          sprite.animations.add('stand', Phaser.Animation.generateFrameNames('stand/', 1, 1, '.png', 3), 10, true, false);
          sprite.animations.add('attack', Phaser.Animation.generateFrameNames('attack/', 1, 5, '.png', 3), 10, true, false);
          sprite.animations.add('walk-down', Phaser.Animation.generateFrameNames('walk/down/', 1, 6, '.png', 3), 10, true, false);
          sprite.animations.add('walk-left', Phaser.Animation.generateFrameNames('walk/left/', 1, 6, '.png', 3), 10, true, false);
          sprite.animations.add('walk-up', Phaser.Animation.generateFrameNames('walk/up/', 1, 6, '.png', 3), 10, true, false);
          sprite.animations.add('walk-right', Phaser.Animation.generateFrameNames('walk/right/', 1, 6, '.png', 3), 10, true, false);

          //console.log("animations " , sprite.animations);
        //  console.log("animations " , sprite.animations.frames);

        //  sprite.currentFrame = sprite.animations.currentAnim;
          sprite.animations.play('stand');
          Utils.tintSprite(sprite, playerId);

          game.physics.enable(sprite, Phaser.Physics.ARCADE);

          actionTimer = game.time.create(false);

          lifeRect = new Phaser.Rectangle(sprite.x, sprite.bottom, sprite.width, 10);
          // Red background for life, set to width 0 on start
          lifeRectBackground = new Phaser.Rectangle(sprite.right, sprite.bottom, 0, 10);

          game.time.events.loop(100, closestEnemyUnit); //Efficient AI method (don't need update)
        };
        this.render = function(){
          if (!sprite.alive) return;
          game.debug.geom(lifeRect, 'rgba(0, 200,0,0.5)');
          game.debug.geom(lifeRectBackground, 'rgba(200, 0,0,0.5)');
        };
        this.update = function(){
          if (life <= 0 ){
            if (playerId === PLAYER_ID)Dialog.emoji(sprite.x, sprite.y, 'dead');
            //TODO destroy whole object
            status = DEAD;
            sprite.destroy();
            lifeRect.width = 0; lifeRectBackground.width =0;
            actionTimer.stop();

            Utils.removeUnit(id, playerId);
            //console.log("Destroyed unit " , sprite);
            return;
          }
          if (previousPath.length > 0) moveTo(previousPath);

            updateLife();
        };
        this.findPathTo= findPathTo;

        this.stop = function(){
          previousPath = [];

          pathfinder.setCallbackFunction(function(path) {});
          pathfinder.preparePathCalculation([0,0], [0,0]);
          pathfinder.calculatePath();
        };
        this.followCamera = function(){
          game.camera.follow(sprite);
        };
        this.receiveAttack = function(attackerType){
          life -= Utils.damage(attackerType, type);
        };
        // Public resource collection function
        this.collect = collectResource;
        this.build = function(x, y){
          console.log("Unit building ", x, y);
          building = {x: x, y: y}; //Temp data for building
          findPathTo(x, y, function(){
              startBuilding();
          });
        };
        this.setVisible = function(visibility){
          sprite.visible = visibility;
        };
        this.changePlayer = function(newPlayerId){
          Utils.removeUnit(id, playerId);

          playerId = newPlayerId;
          Utils.tintSprite(sprite, playerId);

          Global.units[playerId].push(this);
        };
        this.kill = function(){
          life = 0;
        };

        this.properties = function(){
          return {
            id: id,
            type: type,
            player: playerId,
            status: status,
            isAlive: sprite.alive,
            x: sprite.x, y: sprite.y,
            viewRange: VIEW_RANGE
          };
        };
        this.inView = inView;
        this.say = function(text, msAlive){
          if (text instanceof Array) {
            Dialog.many(sprite.x, sprite.top, text);
          } else {
            Dialog.new(sprite.x, sprite.top, text, msAlive);
          }
        };
    };

    return {
      new: function(x, y, playerId, type){

        //console.log("Creating new unit on " ,x,y,playerId);
        var unit = new Unit(x, y, playerId, type);
        Global.units[playerId].push(unit);
        return unit;
      },
      preload: function(){
        var game = Global.game;
        game.load.atlasJSONHash('player', 'assets/img/link-white.png', 'assets/img/zelda32.json');
        game.load.atlasJSONHash('enemy', 'assets/img/enemy-white.png', 'assets/img/enemy.json');
        game.load.atlasJSONHash('enemy2', 'assets/img/enemy2.png', 'assets/img/enemy2.json');

      }
    };
});
