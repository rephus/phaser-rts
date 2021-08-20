define(['module/Global', 'module/Utils'],
function(Global, Utils) {

  function playLevel(levelName){
      Global.levelName = levelName;
      Global.game.state.start('level');
  }

  function drawPoints(points){
    var game = Global.game;

    points.forEach(function(p){
        var s = game.add.sprite(p[0], p[1], 'level-select');
        s.width = 16; s.height = 16;
        s.anchor.setTo(0.5,0.5);
    });
  }

    return {
        map: 'assets/tilemaps/cross.json',
        preload: function(){
          Global.game.load.image('button', 'assets/img/button.png');
          Global.game.load.image('background', 'assets/img/map-select.png');
          Global.game.load.image('level-select', 'assets/img/level-select.png');

        },

        create: function(){
          var game = Global.game;

          var background =  game.add.sprite(0, 0, 'background');
        //  Utils.textButton(game.world.centerX, 10, 'Level test', function(){playLevel('Test');});
        //  Utils.textButton(game.world.centerX, 100, 'Play Level 1',  function(){playLevel('1');});
            game.add.button(100, 100, 'level-select', function(){playLevel('Test');});
            game.add.button(300, 300, 'level-select', function(){playLevel('1');});
            game.add.button(500, 500, 'level-select', function(){playLevel('2');});

            drawPoints([[150,150], [200,200],  [250,250]]);
        },
        update: function(){

        },
        render: function(){}

    };
});
