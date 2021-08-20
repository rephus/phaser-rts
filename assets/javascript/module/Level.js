define(['module/HUD', 'module/Resource', 'module/Unit', 'module/Global', 'module/Utils', 'module/Building', 'module/Controls', 'module/Dialog', 'module/AI'],
    function(HUD, Resource, Unit, Global, Utils, Building, Controls, Dialog, AI) {

        //Private variables
        var game;
        var map, layer;
        var LevelLogic;

        var LAYER_ANIMATION = 500; // ms to loop between layer animations

        function worldToTile(x, y) {
            return [Math.max(0, layer.getTileX(x)), Math.max(0, layer.getTileY(y)) ];
        }

        function debugPath(path, enable){
          if (Global.debug) {
              path.forEach(function(p) {
                map.getTile(p.x, p.y).debug = enable;
              });
              layer.dirty = true;
          }
        }
        function debugTile(x, y, enable) {
            if (Global.debug) {
                map.getTile(x, y).debug = enable;
                layer.dirty = true;
            }
        }

        function loadObjects() {
            var enemyId = 1;
            var map = Global.map;
            var tileSize = map.tileWidth;
            console.log("Map ", map);
            for (y = 0; y < map.height; y++)
                for (x = 0; x < map.width; x++) {
                    var tile = map.getTile(x, y, 'objects');
                    if (tile) switch (tile.index-1 ) {

                        //Main player (0)
                        case 0:  Unit.new(x * tileSize, y * tileSize, PLAYER_ID, 0);break;
                        case 6:  Unit.new(x * tileSize, y * tileSize, PLAYER_ID, 1);break;
                        case 12:  Unit.new(x * tileSize, y * tileSize, PLAYER_ID, 2);break;

                        case 18:  Building.new(x * tileSize, y * tileSize, PLAYER_ID, 0);break;
                        case 24:  Building.new(x * tileSize, y * tileSize, PLAYER_ID, 1);break;
                        case 30:  Building.new(x * tileSize, y * tileSize, PLAYER_ID, 2);break;

                        //Player 1
                        case 1: Unit.new(x * tileSize, y * tileSize, 1, 0); break;
                        case 7: Unit.new(x * tileSize, y * tileSize, 1, 1); break;
                        case 13: Unit.new(x * tileSize, y * tileSize, 1, 2); break;

                        case 19:  Building.new(x * tileSize, y * tileSize, 1, 0);break;
                        case 25:  Building.new(x * tileSize, y * tileSize, 1, 1);break;
                        case 31:  Building.new(x * tileSize, y * tileSize, 1, 2);break;

                        // Player 2
                        case 2: Unit.new(x * tileSize, y * tileSize, 2, 0); break;
                        case 8: Unit.new(x * tileSize, y * tileSize, 2, 1); break;
                        case 14: Unit.new(x * tileSize, y * tileSize, 2, 2); break;

                        case 20:  Building.new(x * tileSize, y * tileSize, 2, 0);break;
                        case 26:  Building.new(x * tileSize, y * tileSize, 2, 1);break;
                        case 32:  Building.new(x * tileSize, y * tileSize, 2, 2);break;

                        //Player 3
                        case 3: Unit.new(x * tileSize, y * tileSize, 3, 0); break;
                        case 9: Unit.new(x * tileSize, y * tileSize, 3, 1); break;
                        case 15: Unit.new(x * tileSize, y * tileSize, 3, 2); break;

                        case 21:  Building.new(x * tileSize, y * tileSize, 3, 0);break;
                        case 27:  Building.new(x * tileSize, y * tileSize, 3, 1);break;
                        case 33:  Building.new(x * tileSize, y * tileSize, 3, 2);break;

                        //Landmarks
                        case 5: star = {x: x * tileSize, y: y * tileSize}; break;
                        case 11: landmark = {x: x * tileSize, y: y * tileSize}; break;

                        //resources
                        case 4: Resource.new(x * tileSize, y * tileSize, 0); break;
                        case 10: Resource.new(x * tileSize, y * tileSize, 1); break;
                        case 16: Resource.new(x * tileSize, y * tileSize, 2); break;

                        default: console.warn("Found Unexpected " + (tile.index) + " at " + x + "x" + y);
                    }
                }
        }


        //Public functions
        return {
            init: function(_levelLogic) {
                Global.status = "play";

                game = Global.game;
                Global.level = this;
                LevelLogic = _levelLogic;

                HUD.init();
                Controls.init();
                AI.init(1); //playerId = 1
            },
            preload: function() {

                console.log("Loading map ", LevelLogic.map);
                game.load.tilemap('map', LevelLogic.map, null, Phaser.Tilemap.TILED_JSON);
                game.load.image('tile1', 'assets/tilesets/tilea4.png');
                game.load.image('tiel1a', 'assets/tilesets/tilea1.png');
                game.load.image('tile2', 'assets/tilesets/tilea2.png');
                game.load.image('desert', 'assets/tilesets/desert.png');

                //   game.load.tilemap('map', 'assets/tilemaps/chip-forest2.json', null, Phaser.Tilemap.TILED_JSON);
                //     game.load.image('chip-forest2', 'assets/tilesets/chip-forest2.png');

                Unit.preload();
                HUD.preload();
                Building.preload();
                Dialog.preload();
                LevelLogic.preload();
            },
            create: function() {

                // Create tilemap from json
                map = game.add.tilemap('map');
                map.addTilesetImage('tile1', 'tile1');
                map.addTilesetImage('tiel1a', 'tiel1a');
                map.addTilesetImage('tile2', 'tile2');
                map.addTilesetImage('desert', 'desert');

                layer = map.createLayer('ground');
                var animatedLayer = map.createLayer('ground-animated');
                if (animatedLayer) game.time.events.loop(LAYER_ANIMATION, function(){
                  animatedLayer.visible = !animatedLayer.visible;
                });

                layer.resizeWorld();
                layer.debug = Global.debug;
                Global.map = map;

                loadObjects();

                Controls.create();
                HUD.create();
                LevelLogic.create();
                AI.create();

                // Create all modules after being set by levellogic
                function callCreate(object){ object.create(); }
                Utils.allResources().forEach(callCreate);
                Utils.allUnits().forEach(callCreate);
                Utils.allBuildings().forEach(callCreate);

                console.log("Created units on level: ", Global.units);
                var firstUnitPos = Global.units[PLAYER_ID][0].properties();
                game.camera.focusOnXY(firstUnitPos.x, firstUnitPos.y); //Focus camera on first unit


                LevelLogic.start();
            },
            update: function() {
                if (Global.status != "play") return;

                function callUpdate(object){ object.update(); }
                Utils.allResources().forEach(callUpdate);
                Utils.allUnits().forEach(callUpdate);
                Utils.allBuildings().forEach(callUpdate);

                Controls.update();
                LevelLogic.update();

            },
            render: function() {
                if (Global.status != "play") return;

                function callRender(object){ object.render(); }
                Global.selectedUnits[PLAYER_ID].forEach(callRender);
                //TODO resource
                //TODO building

                Controls.render();
                LevelLogic.render();
                HUD.render();

                Utils.render(); //For rendering progrss bars
            },
            debugTile: debugTile,
            debugPath: debugPath,
            worldToTile: worldToTile

        };
    });
