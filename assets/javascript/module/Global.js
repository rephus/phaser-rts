/*
New object module
Dependencys: null
*/
//Unit types

//Globally accessible variables (static)
var UNIT_TYPES = 3;
var ROCK = 0;
var PAPER = 1;
var SCISSOR = 2;
// Used on image names and stuff
function typeToName (type){
  var array = ['rock', 'paper', 'scissor'];
  return array[type];
}

var BUILDING_COST =  10; //Used in both controls and unit
var UNIT_COST = 5;

var PLAYER_ID = 0; // Human player ID

define(function() {
  return {
      //game: undefined,
      status: "play", //play, game_over, debug
      resources: [[0,0,0], [0,0,0], [0,0,0], [0,0,0]],
      levelResources: [[],[],[]],
      levelName: 'Test',
      debug: true,
      visibleMap: false,
      map: undefined, //Set on level.create
      level: undefined, // set on Level.create,
      units: [[],[],[],[]], // List of all units
      buildings: [[],[],[],[]], // List of all buildings
      selectedUnits: [[],[],[],[]], //List of all selected units
      enemyPlayerIds: [[1,2,3],[0,2,3],[0,1,3],[0,1,2]],
      walkables: [0],
      ai: true,
      tileSize: 32
  };

});
