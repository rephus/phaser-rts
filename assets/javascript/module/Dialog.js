
define(['module/Global'], function(Global) {

  var modal;
  var game;

  var nextDialogId = 0;
  return {
    gameOver: function(win, callback){
      console.log("Game ", game.camera, game.world);
      // * win:boolean = true if win, false if lost
      modal.createModal({
          type:"gameover",
          includeBackground: true,
          modalCloseOnClick: false,
          fixedToCamera: true,
          itemsArr: [{
                type: "text",
                content: (win)?"You win":"You lost",
                fontSize: 32,
                color: (win)?"0x00ff00":"0xff0000",
                callback: callback,
          }]
      });
      modal.showModal("gameover");
    },
    emoji: function(x, y, emoji, destroyMs) {
      if (!destroyMs) destroyMs = 500; //default

      grid = {
        'dead': 405,
        'waiting': 450,
        'fight': 616,
        'heart': 213,
        'stop': 242,
        'victory': 632,
        'warning': 871,
        'tada': 818,
        'muscle': 766,
        'star': 633,
        'collect': 825,
        'idea': 496,
        'build': 178,
        'fire': 740,
        'walk': 434,
        'born': 372
      };
      var frame = 0;
      if (grid[emoji]) frame = grid[emoji];
      //https://github.com/photonstorm/phaser-examples/blob/master/examples/tweens/easing%20spritesheets.js
      //https://github.com/netgfx/phaser_modals/blob/master/examples/example1/js/index.js#L162
      var modalId = "dialog"+nextDialogId;
      nextDialogId++;
      modal.createModal({
          type:modalId,
          includeBackground: false,
          modalCloseOnClick: true,
          x: x +16,
          y: y -48,
          itemsArr: [
            {
                type: "image",
                content: "emoji-box",
                callback: function () {
                    modal.hideModal(modalId);
                },
            },
            {
                type: "image",
                content: "dialog",
                offsetY: +24 //align bottom
            },
                {
                    type: "tileSprite",
                    content: "emojis",
                    frame: frame,
                    tileSpriteWidth: 32,
                    tileSpriteHeight: 32,
                    //offsetY: -16,
                  //  offsetX: -16

                }
          ]
      });
      modal.showModal(modalId);

      game.time.events.add(destroyMs, function(){
         if (game.modals[modalId]) modal.destroyModal(modalId);
      });
    },

     many: function(x, y, texts, callback){
       //USed to show multiple sequential dialog boxes
        if (texts.length === 0 ) {
            if (callback) callback();
          return;
        }
        var that = this;

        var text = texts[0];
        this.new(x,y, text, undefined, function(){
           texts.shift();
           that.many(x,y,texts, callback);
        });
     },
      new: function(x, y, text, destroyMs, callback){

        // TODO Dynamic dialog boxes, with automatic size and text wordwrap
        // TODO click / callback when click anywhere on the game or stop game
        var dialogScale = 1;
        if (text.length < 20 ) dialogScale = 0.5;
        //https://github.com/netgfx/phaser_modals/blob/master/examples/example1/js/index.js#L162
        var modalId = "dialog"+nextDialogId;
        nextDialogId++;
        modal.createModal({
            type:modalId,
            includeBackground: false,
            backgroundOpacity: 0,
            modalCloseOnClick: true,
            x: x,
            y: y,
            itemsArr: [
                  {
                      type: "image",
                      content: "dialog-box",
                      contentScale: dialogScale,
                      callback: function () {
                          modal.hideModal(modalId);
                          if (callback) callback();
                      },
                      offsetY: -128 / 2, //align bottom (sprite height / 2)
                      wordWrap: true //Resize image if there is another text
                  },
                  {
                      type: "text",
                      content: text,
                    //  fontFamily: "Luckiest Guy",
                      fontSize: 16,
                      wordWrap: true,
                      color: "0x000000",
                      offsetY: -128/2 - 16 , // dialog-box height / 2 - font-size
                  }
            ]
        });
        modal.showModal(modalId);

        if (destroyMs) game.time.events.add(destroyMs, function(){
           if (game.modals[modalId]) modal.destroyModal(modalId);
        });
      },
      preload: function(){
        game = Global.game;
        modal = new gameModal(game);
        game.load.spritesheet('emojis', 'assets/img/emojis.png', 32,32);
        game.load.image('dialog-box', 'assets/img/dialog-box.png');
        game.load.image('emoji-box', 'assets/img/emoji-box.png');
        game.load.image('dialog', 'assets/img/dialog-small.png');
        game.load.image('text-arrow', 'assets/img/text-arrow.png');

      }
  };
});
