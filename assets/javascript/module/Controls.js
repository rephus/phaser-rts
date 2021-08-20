

define(['module/Global', 'module/Utils', 'module/Dialog'], function(Global, Utils, Dialog) {

    //Private variables
    var game = null;

    var cursors ; //keyboard

    var CAMERA_SPEED = 5;

    var DOUBLE_CLICK_TIME = 300;

    var SINGLE_CLICK = "single_click";
    var DOUBLE_CLICK = "double_click";
    var DRAG = "drag";
    var NONE = "none";
    var CLICK_BUILDING = "click_building";
    var PLACE_BUILDING = "place_building";

    var mouseStatus = NONE;
    var clickStart ;
    var clickTime ;

    var dragRect;
    var overrideMove = false;

    //Building stuff
    var building; //Placeholder for building

    function setDragRect(x, y, w, h){
      dragRect.x = x; dragRect.y = y;
      dragRect.width = w; dragRect.height = h;
    }
    function doNotMove(){
       // Hacky method to avoid nit moving when clicking to a different sprite
       // aka blocks moving for a second
       // THis works because sprite have more priorityID (by default?)
       // eg: resource or building
       overrideMove = true;
       game.time.events.add(1000, function(){
          overrideMove = false;
       });
    }
    function startBuilding(){
      console.log("startBuilding ");
      building.alpha = 0;
      mouseStatus = NONE;

      var myUnits = Utils.mySelectedUnits(building.type);
      if (myUnits.length > 0){
        myUnits[0].build(building.x, building.y);
      }
    }

    function selectRectangle(){
      //Select all units in the drag-rectangle area
       var selected = [];
       //  Global.selectedUnits[Global.myPlayer] = [];
       console.log("Select rectangle "+parseInt(dragRect.x)+","+parseInt(dragRect.y)+ ", "+dragRect.width+","+dragRect.height);
        Utils.myUnits(PLAYER_ID).forEach(function(unit){
            var p = unit.properties();
            if (dragRect.contains(p.x, p.y)) selected.push(unit);
        });
        if (selected.length > 0) Global.selectedUnits[PLAYER_ID] = selected;
        dragRect.width = 0;
        //console.log("selected units " , selected);

        return selected; // used in Select
    }
    function selectType(){
      /*First, we select one unit with select() method,
        then we select all the other units with the same type
        Only capture those included in the camera
        */
        var selected = select();
        if (selected){

           var type = selected.properties().type;
           Global.selectedUnits[PLAYER_ID] = []; //Reset selection
           setDragRect(- game.world.x, - game.world.y, game.camera.width, game.camera.height);

           Utils.myUnits(PLAYER_ID).forEach(function(unit){
               if (unit.properties().type == type) {
                 var p = unit.properties();
                 if (dragRect.contains(p.x, p.y)) Global.selectedUnits[PLAYER_ID].push(unit);
               }
           });
           dragRect.width = 0;
      }
    }
    function select(){
      // Create tiny rectangle and use selectRectangle method
      var unitSize = 32;

      //Create tiny rectangle to see if a unit is inside
      setDragRect(game.input.activePointer.worldX - unitSize/2, game.input.activePointer.worldY - unitSize/2, unitSize, unitSize);
       var selected = selectRectangle();
       //If select rectangle returns more than 1, select only the first one
       if (selected.length > 0) Global.selectedUnits[PLAYER_ID] = [selected[0]];
       return selected[0]; //Used in selectType
    }
    function move(){

          if (overrideMove) return;

          var x = game.input.activePointer.worldX; //clickStart.x
          var y = game.input.activePointer.worldY; //clickStart.y
          Dialog.emoji(x, y,'walk');

          var myUnits =    Global.selectedUnits[PLAYER_ID];
          console.log("Moving selected units " , myUnits.length);
          for (var i =0 ; i < myUnits.length; i++){
            var unit = myUnits[i];
            xy = Utils.spiral(i);
            unit.findPathTo(x + xy[0] * 32,  y + xy[1]* 32);
          }
    }

    function inputDown() {
      if (game.input.activePointer.rightButton.isDown) return;
      if (mouseStatus != NONE) return;
        // Copy x and y values from mousepointer
        clickStart = {x: game.input.activePointer.worldX, y: game.input.activePointer.worldY};
        //console.log("Time since last click " , game.time.now - clickTime);
        if (game.time.now - clickTime < DOUBLE_CLICK_TIME) mouseStatus = DOUBLE_CLICK;
        else  mouseStatus = SINGLE_CLICK;

        clickTime = game.time.now;

        // Debug walkables tile
        var xy = Global.level.worldToTile(game.input.activePointer.worldX, game.input.activePointer.worldY);
        var tile = Global.map.getTile(xy[0], xy[1]);
        if (Global.walkables.indexOf(tile.index) == -1)   console.log("Non walkable tile ", tile.index);
    }

    function mouseDragMove() {
      if (mouseStatus == PLACE_BUILDING || mouseStatus == CLICK_BUILDING){
          building.x = game.input.activePointer.worldX;
          building.y = game.input.activePointer.worldY;
      } else if (mouseStatus != NONE){
        //Not actual distance, but simpler formula
        var distance = Math.abs(clickStart.x - game.input.mousePointer.x) +
          Math.abs(clickStart.y - game.input.mousePointer.y);

        if (distance > 20 && game.time.now - clickTime > 100){
          mouseStatus = DRAG;
          setDragRect( Math.min(game.input.activePointer.worldX, clickStart.x) ,
            Math.min(game.input.activePointer.worldY, clickStart.y) ,
            Math.abs(game.input.activePointer.worldX -clickStart.x),
            Math.abs(game.input.activePointer.worldY - clickStart.y ));
        }
      }
    }

    //Public functions
    return{
        init: function() {
          game = Global.game;
        },
        create: function() {
          cursors = game.input.keyboard.createCursorKeys();

          game.input.onUp.add(function(){
            var elapsed = game.time.now - clickTime;
            // Right click
            if (game.input.activePointer.rightButton.isDown){
              move();
              return;
            }

            // Left click
            switch(mouseStatus) {
              case SINGLE_CLICK: select(); break;
              case DOUBLE_CLICK: selectType(); break;
              case DRAG: selectRectangle(); break;
              // This 2 mouse statuses allow us to click once on the icon,
              //and drop it later with another click
              case PLACE_BUILDING: startBuilding(); break;
              case CLICK_BUILDING: mouseStatus = PLACE_BUILDING; break;
            }
            if (mouseStatus != PLACE_BUILDING) mouseStatus = NONE;

          }, this);

          game.input.onDown.add(inputDown, this);
          game.input.addMoveCallback(mouseDragMove, this);

          //prevent right click on canvas
          game.canvas.oncontextmenu = function (e) { e.preventDefault(); };

          dragRect = new Phaser.Rectangle(0, 0, 0, 0);

          building = game.add.sprite(0,0, 'castle-rock');
          building.alpha = 0;
          building.width = 48; building.height = 48;
          building.anchor.setTo(0.5, 0.5);
        },
        update: function(){
            if (cursors.left.isDown)  game.camera.x -= CAMERA_SPEED;
            if (cursors.right.isDown)  game.camera.x += CAMERA_SPEED;
            if (cursors.up.isDown)  game.camera.y -= CAMERA_SPEED;
            if (cursors.down.isDown)  game.camera.y += CAMERA_SPEED;
        },
        render: function(){
          game.debug.geom(dragRect, 'rgba(0, 200,0,0.2)');
        },
        clickBuilding: function(sprite){ //event given as argument in HUD
          var type = sprite.type;
            if (Global.resources[PLAYER_ID][type] < BUILDING_COST) {
              Dialog.new(150, game.height - 10,"Not enough resources", 1000);
              return;
            }
            var selectedUnitType = Utils.mySelectedUnits(type);
            if (selectedUnitType.length === 0){
              Dialog.new(150, game.height - 10,"Select unit first ", 1000);
              return;
            }

            mouseStatus= CLICK_BUILDING;
            building.key = 'castle-'+typeToName(type);
            building.x = game.input.activePointer.worldX;
            building.y = game.input.activePointer.worldY;
            building.type = type;
            building.alpha = 1;
          //  doNotMove();
        }

    };
});
