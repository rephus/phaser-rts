var lastKnownEnemyPosition = {};
var lastKnownResourcePosition = {};

define(['module/Global', 'module/Utils'], function(Global, Utils) {

    var playerId = 1;
    var game;

    var AI_FREQUENCY = 1000;
    var KNOWS_POSITION = false;

    var isBuilding = false; // Check if building is being built, to avoid double building
    // ------------------
    // AI CONSTANTS (medium balanced difficulty)
    // -----------------------

    var EASY = 'easy';
    var NORMAL = 'normal';
    var DIFFICULT = 'difficult';
    var difficulty = NORMAL;

    // TODO not used
    var COLLECTION = 'collection';
    var ATTACK = 'attack';
    var EXPLORE = 'explore';
    var BALANCED = 'balanced';
    var attitude = BALANCED;
    //TODO random

    var MIN_DISTANCE_BUILDING = 1000;

    var PERCENT_COLLECTION = 40;
    var PERCENT_ATTACK = 40;
    var PERCENT_EXPLORE = 20;
    function getRandomAction(){
      var r = Utils.random(0, 100);
      if (r < PERCENT_COLLECTION) return COLLECTION;
      else if (r < PERCENT_COLLECTION + PERCENT_ATTACK) return ATTACK;
      else return EXPLORE;
    }

    var PERCENT_ROCK = 33;
    var PERCENT_PAPER = 33;
    var PERCENT_SCISSOR = 33;
    function getRandomType(){
      var r = Utils.random(0, 100);
      if (r < PERCENT_ROCK) return ROCK;
      else if (r < PERCENT_ROCK + PERCENT_PAPER) return PAPER;
      else return SCISSOR;
    }
    //TODO Random

    var SQUAD_SIZE = 5; //Size of the attack squad
    var MAX_COLLECTION = 10; //if exceeded, no more collection units
    var MAX_EXPLORE = 5; //if exceeded, no more exploration units
    var MAX_UNITS = 50; //if exceeded, we'll stop creating units

    // ------------------
    // PRIVATE METHODS
    // -----------------------

    function setDifficulty(difficulty){
        switch(difficulty){
          case EASY:
            AI_FREQUENCY = 5000;
            SQUAD_SIZE = 1;
            MAX_UNITS = 20;
            MAX_COLLECTION = 5;
            MIN_DISTANCE_BUILDING = 5000;
          break;
          case DIFFICULT:
            AI_FREQUENCY = 1000;
            SQUAD_SIZE = 10;
            MAX_UNITS = 100;
            MAX_COLLECTION = 20;
            MAX_EXPLORE = 2;
            MIN_DISTANCE_BUILDING = 1000;

          break;
        }
    }
    var collectionSquad = [];
    var explorationSquad = [];
    var attackSquads = [[]];
    function addUnitToAttackSquad(unit){
      for (var i =0 ; i< attackSquads.length; i++){
        var squad = attackSquads[i];
        if (squad.length < SQUAD_SIZE) {
           squad.push(unit);
           return;
        }
      }
      //Add new one
      attackSquads.push([unit]);
    }

    function updateSquads(){
      function filterDeadUnits(unit){
        return unit.properties().status != 'dead';
      }

      explorationSquad = explorationSquad.filter(filterDeadUnits);
      collectionSquad = collectionSquad.filter(filterDeadUnits);
      attackSquads.forEach(function(squad){
        squad = squad.filter(filterDeadUnits);
      });

      //TODO reshuffle unit types

    }
    var mapRectangle;

    function myUnits(type) {
        if (!type) return Global.units[playerId];
        else return Global.units[playerId].filter(function(unit) {
            return unit.properties().type == type;
        });
    }

    function myEnemies() {
        return Utils.enemies(playerId);
    }

    function saveObjectsSeen(json, category) {

        function saveProperties(object) {
            json[object.properties().id] = object.properties();
        }
        myUnits().forEach(function(unit) {
            unit.inView(category).forEach(saveProperties);
        });
        //console.log("lastKnownEnemyPosition ", lastKnownEnemyPosition);
    }

    function knowsEnemy() {
        return Object.keys(lastKnownEnemyPosition).length > 0 || KNOWS_POSITION;
    }


    function getFirstObjectSeen(json, type) {
        var ids = Object.keys(json);
        if (ids.length > 0) {
            if (!type) return json[ids[0]];
            else {
                for (var i = 0; i < ids.length; i++) {
                    var object = json[ids[i]];
                    if (object.type == type) return object;
                }
            }
        } else return undefined;
    }

    function foundEnemy(){
      var enemyPos;
      //TODO return randomObjectSeen instead of first on enemies
      if (KNOWS_POSITION) {
          var closestEnemy = Utils.closest(myUnits()[0].properties(), enemies);
          enemyPos = closestEnemy.properties();
      } else {
          enemyPos = getFirstObjectSeen(lastKnownEnemyPosition);
          if (!enemyPos) console.log("No enemies to attack, need to explore");
      }
      return enemyPos;
    }
    function foundResource(unit){
      var resource;
      var properties = unit.properties();

      if (KNOWS_POSITION) {
          resource = Utils.closest(properties, Global.levelResources[properties.type]);
      } else {
          //We don't store the reference on the json, so we need to iterate on the resouce to collect it
          knownResource = getFirstObjectSeen(lastKnownResourcePosition, properties.type);
          //console.log("Collecting resource unit "+ unit.type  + " type " + type + " ", knownResource);
          if (!knownResource) {
              console.log("No known resource, need to explore");
              unitExplore(unit);
              return;
          }
          resource = Utils.getResource(knownResource.id);

          if (!resource) {
              console.info("No resource found " + knownResource.id + " resource might be gone");
              //removeFirstObjectIfNotSeen(lastKnownResourcePosition, 'resources');
              removeObjectSeen(lastKnownResourcePosition, knownResource.id);
              return;
          }
      }
      return resource;
    }

    function removeFirstEnemyIfNotSeen() {
        removeFirstObjectIfNotSeen(lastKnownEnemyPosition, 'enemies');
    }

    function removeObjectSeen(json, id){
        delete json[id];
    }
    function removeFirstObjectIfNotSeen(json, category, type) {
        /* Remove first enemy if once the units go to the last known position and that unit is not there,
          so we can iterate on the list of lastKnownEnemyPosition
        */
        var object = getFirstObjectSeen(json, type);
        if (object) {
            var objectId = object.id;
            var units = myUnits();
            var isThere = false;
            for (var i = 0; i < units.length; i++) {
                var inview = units[i].inView(category);
                for (var j = 0; j < inview.length; j++) {
                    var inviewId = inview[j].properties().id;
                    if (inviewId == objectId) {
                        isThere = true;
                        break;
                    }
                }
                if (isThere) break;
            }
            if (!isThere) {
                //console.log("Removing "+type+ " " + objectId + " from list of seen");
                delete json[objectId];
            }
        }
    }
    function assignRandomAction(unit){
      //TODO change assignation based on max units (eg max collectors, explorers)
        var action = getRandomAction();
        switch(action){
          case COLLECTION:
           if (collectionSquad.length > MAX_COLLECTION) assignRandomAction(unit); //retry
           collectionSquad.push(unit);
           unitCollect(unit);
           break;
          case ATTACK:
            addUnitToAttackSquad(unit);
            break;
          case EXPLORE:
            if (explorationSquad.length > MAX_EXPLORE) assignRandomAction(unit); //retry
            explorationSquad.push(unit);
            unitExplore(unit);
            break;
          default:
            console.error("Unexpected random action ", action);
        }
        console.log("Total units, "+myUnits().length+" Squad ", collectionSquad.length, explorationSquad.length, attackSquads);

    }
    function unitExplore(unit) {
        // Move to random directions, exploring the map and recording the enemies encountered
        var point = new Phaser.Point();

        mapRectangle.random(point);
        point.floor();
        if (unit.properties().status == "idle") unit.findPathTo(point.x, point.y);
    }

    function explore() {
        //All idle units go to explore
        explorationSquad.forEach(unitExplore);
    }

    function attack() {
        var enemies = myEnemies();
        if (enemies.length === 0) return; // no enemies
        if (attackSquads[0].length < SQUAD_SIZE) return;
        if (!knowsEnemy()){
            console.log("Can't find enemies to attack, exploring");
            attackSquads[0].forEach(unitExplore);
            return;
        }

        var enemyPos = foundEnemy();

        function moveToEnemy(unit, i){
          //TODO Select a different enemy pos per squad
          //TODO apply spiral algorithm
          //if when we arrive to the destination, that unit is not there, we remove it from the list of last seen
          if (unit.properties().status == "idle")
              unit.findPathTo(enemyPos.x, enemyPos.y, removeFirstEnemyIfNotSeen);
        }
        if (enemyPos) for (var i = 0; i < attackSquads.length; i++) {
          var squad = attackSquads[i];
          if (squad.length >= SQUAD_SIZE)  squad.forEach(moveToEnemy);

        }
    }

    function unitCollect(unit) {
        var type = unit.properties().type;

        //If no buildings, don't collect. SOmeone will create a building on the createBuilding method
          if (Utils.buildings(playerId, type).length === 0) return;

        var resource = foundResource(unit);
        if (!resource) unitExplore(unit);
        else if (unit.properties().status == "idle") unit.collect(resource);
    }

    function collect() {
        //All idle units collect their resource types
        collectionSquad.forEach(unitCollect);
    }

    function createBuilding(type){
        if (isBuilding) return;

        var knownResource = getFirstObjectSeen(lastKnownResourcePosition, type);
        var myBuildings = Utils.buildings(playerId, type);
        if (Global.resources[playerId][type]< BUILDING_COST) return; //not enough resources

      //  var unitTypes = explorationSquad.filter(function(u){return u.properties().type==type;});
        //if (unitTypes.length === 0) return; //not units of that type
        var unitTypes = myUnits(type);
        if (unitTypes.length === 0) return; //No units of that type
        var unit = unitTypes[0];

        if (myBuildings.length === 0) {
            console.log("Starting new building type " + type);
            unit.build(knownResource.x, knownResource.y);
            isBuilding = true;
            game.time.events.add(10000,function(){isBuilding=false;});
            return;
        } else {
            var closestBuilding = Utils.closest(knownResource, myBuildings);
            var distance = Utils.distance(knownResource, closestBuilding.properties());
            if (distance > MIN_DISTANCE_BUILDING) {
              console.log("Resource ", knownResource, "too far from building ", closestBuilding.properties(), distance);
              unit.build(knownResource.x, knownResource.y);
              //TODO Set base point to avoid weird terrain locations
            }
        }
    }

    function ai() {
        if (Global.status != 'play' || !Global.ai) return;

        if (collectionSquad.length ===0 ){
          //assign random actions at the beggining of game
          myUnits().forEach(assignRandomAction);
        }
        updateSquads();
        //TODO balance squads ? (based on resources, etc)
        saveObjectsSeen(lastKnownResourcePosition, 'resources');
        saveObjectsSeen(lastKnownEnemyPosition, 'enemies');

        collect();
        attack();
        explore();

        var type = getRandomType();

        createBuilding(type); //TODO is this even triggered ? coz units are cheaper than buildings

        var buildings = Utils.buildings(playerId, type);
        if (Global.resources[playerId][type] > UNIT_COST &&
            buildings.length > 0 &&
            myUnits().length < MAX_UNITS) {
            Utils.randomArray(buildings).createUnit(assignRandomAction);
        }
    }

    return {

        init: function(_playerId) {
            game = Global.game;
            playerId = _playerId;
            game.time.events.loop(AI_FREQUENCY, ai);

            setDifficulty(NORMAL); //doesn't do anything
        },
        create: function() {
            var map = Global.map;
            mapRectangle = new Phaser.Rectangle(0, 0, map.width * map.tileWidth, map.height * map.tileHeight);
        }
    };
});
