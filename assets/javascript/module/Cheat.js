var cheat;

define(['module/Global', 'module/Utils', 'module/HUD'], function(Global, Utils, HUD) {
  var cheats = ['killme', 'killthem', 'resources', 'units', 'ai', 'visiblemap'];

    function help(){
        console.log("Expected cheats:\n* "+  cheats.join('\n* ') );
    }

    cheat = function(input){

      if (input) switch(input.toLowerCase()){
        case 'killme': Global.units[PLAYER_ID].forEach(function(unit){unit.kill();});break;
        case 'killthem': Global.units[1].forEach(function(unit){unit.kill();});break;
        case 'resources': Global.resources[PLAYER_ID] = [10,10,10]; break;
        case 'units':
          for (var i=0; i< 10; i++) Global.buildings[PLAYER_ID][0].spawnUnit();
          break;
        case 'ai': Global.ai = !Global.ai;break;
        case 'visiblemap': Global.visibleMap = !Global.visibleMap; break;

        default:
          console.log("Unrecognized cheat: " + input);

          help();
      } else help();
    };

});
