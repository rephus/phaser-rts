define(['module/Global', 'module/Utils', 'module/Dialog', 'module/Resource', 'module/Unit', 'module/Building'],
    function(Global, Utils, Dialog, Resource, Unit, Building) {

        var game;

        function createPlayerBase(x, y, playerId) {

            for (var i = 0; i < 3; i++) {
                Resource.new(x + (i * 32), y - 64, type);
                Unit.new(x + (i * 32), y + 64, playerId, type);
            }
            Building.new(x, y, playerId, type);
        }

        function convertAllies(){
          //Convert all allies in view
          Global.units[PLAYER_ID].forEach(function(unit){
            unit.inView('allies').forEach(function(unitInview) {
                unit.say('Found some friends', 2000);
                unitInview.changePlayer(0);
            });
          });

        }

        var landmark, star;


        return {
            map: 'assets/tilemaps/cross.json',
            preload: function() {},

            create: function() {
                //Global.walkables = [ /* sand*/ 29, /* dirt */ 3, 4, 5, 6, 7, 11, 12, 13, 14, 15, 21, 22, 23];
                Global.walkables = [ /* sand*/ 66, /* dirt */ 40, 41, 42, 43, 44, 48, 49, 50, 51, 52,  58, 59, 60];

                //  createPlayerBase( 230, 1350, 0);
                //  createPlayerBase( 1370, 230, 1);
                Global.ai = false;

                game = Global.game;

                // Disable attack between player 0 and player 2
                //allies = !enemies
                Global.enemyPlayerIds[PLAYER_ID] = [1];
                Global.enemyPlayerIds[2] = [1];

            },
            start: function() {
                //All that needs to happen after unit creation and stuff

                // Initial unit setup and animation
                var unit = Global.units[PLAYER_ID][0];
                unit.followCamera();
                unit.findPathTo(652, 920, function() {
                    unit.say([
                        "I managed to scape",
                        "I need to find friends now",
                        "and then find a way to recover our kingdom back"
                    ]);
                    game.camera.unfollow();
                    Global.selectedUnits[PLAYER_ID].push(unit);
                });

                // When any of my units is close to an ally, convert them
                game.time.events.loop(1000, convertAllies);

                // Interaction with first allied unit
                Utils.onUnitInArea(830, 530, 251, 252, function() {
                    Dialog.many(900, 600, // hardcoded allied position
                      [
                        "Hey friend",
                        "There are enemies ahead",
                        "Unfortunatelly, we are not strong enough to face them",
                        "we need to find other friends first",
                        "I'll go with you, let's go"
                    ]);
                });

                // Once at the beggining of the level ,
                //check if all nearby units are defeated
                Utils.onUnitInArea(1276, 90, 220, 225, function(unit) {
                    if (unit.inView('enemies').length === 0) {
                        Dialog.gameOver(true, Utils.resetLevel);
                    }
                }, false); //Don't destroy

            },
            update: function() {
                if (Global.units[PLAYER_ID].length === 0) {
                    Global.status = "game_over";
                    Dialog.gameOver(false, Utils.resetLevel);
                }
            },
            render: function() {}

        };
    });
