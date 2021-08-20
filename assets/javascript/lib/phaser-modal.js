var gameModal = gameModal || {};


gameModal = function (game) {

	var _this = this;
	game.modals = {};

	/**
	 * [hideModal description]
	 * @param  {[type]} type [description]
	 * @return {[type]}      [description]
	 */
	this.hideModal = function (type) {
		window.console.log(type);
		game.modals[type].visible = false;
	};

	return {
		createModal: function (options) {
			var type = options.type || ''; // must be unique
			var includeBackground = options.includeBackground; // maybe not optional
			var backgroundColor = options.backgroundColor || "0x000000";
			var backgroundOpacity = options.backgroundOpacity === undefined ?
				0.7 : options.backgroundOpacity;
			var modalCloseOnClick = options.modalCloseOnClick || false;
			var modalBackgroundCallback = options.modalBackgroundCallback || false;
			var vCenter = options.vCenter || true;
			var hCenter = options.hCenter || true;
			var itemsArr = options.itemsArr || [];
			var fixedToCamera = options.fixedToCamera || false;
			var modalX = options.x;
			var modalY = options.y;
			var margin = options.margin || 10; // image marging when wrapping text

			var modal;
			var modalGroup = game.add.group();
			if (fixedToCamera === true) {
				modalGroup.fixedToCamera = true;
				modalGroup.cameraOffset.x = 0;
				modalGroup.cameraOffset.y = 0;
			}

			if (includeBackground === true) {
				modal = game.add.graphics(game.width, game.height);
				modal.beginFill(backgroundColor, backgroundOpacity);
				modal.x = 0;
				modal.y = 0;
				modal.fixedToCamera = true;

				modal.drawRect(0, 0, game.width, game.height);

				// Close on the modal by closing on any part of the background
				if (modalCloseOnClick === true) {
					modal.inputEnabled = true;
					modal.events.onInputDown.add(function (e, pointer) {
						this.hideModal(type);
					}, _this, 2);

				}
				modalGroup.add(modal);
			}

			var modalLabel;
			var modalText;  // Save text item to resize labelwraptext
			var modalImageWrapText;  //Resize image wrap text with modalText at the end
			for (var i = 0; i < itemsArr.length; i += 1) {
				var item = itemsArr[i];
				var itemType = item.type || 'text';
				var itemColor = item.color || 0x000000;
				var itemFontfamily = item.fontFamily || 'Arial';
				var itemFontSize = item.fontSize || 32;
				var itemStroke = item.stroke || '0x000000';
				var itemStrokeThickness = item.strokeThickness || 0;
				var itemAlign = item.align || 'center';
				var offsetX = item.offsetX || 0;
				var offsetY = item.offsetY || 0;
				var contentScale = item.contentScale || 1;
				var content = item.content || "";
				var centerX = game.width / 2;
				var centerY = game.height / 2;
				var callback = item.callback || false;
				var textAlign = item.textAlign || "left";
				var atlasParent = item.atlasParent || "";
				var buttonHover = item.buttonHover || content;
				var buttonActive = item.buttonActive || content;
				var graphicColor = item.graphicColor || 0xffffff;
				var graphicOpacity = item.graphicOpacity || 1;
				var graphicW = item.graphicWidth || 200;
				var graphicH = item.graphicHeight || 200;
				var graphicRadius = item.graphicRadius || 0;
				var lockPosition = item.lockPosition || false;
				var wordWrap = item.wordWrap || false;
				var itemAnchor = item.anchor || {x:0,y:0};
				var itemAngle = item.angle || 0;
				var itemX = item.x || 0;
				var itemY = item.y || 0;
				var imageFrame = item.frame || null;
				var tileSpriteWidth = item.tileSpriteWidth || game.width;
				var tileSpriteHeight = item.tileSpriteHeight || game.height;

				// Move all items relatively to x,y origin
				modalLabel = null;

				var style = {
					font: itemFontSize + 'px ' + itemFontfamily,
					fill: "#" + String(itemColor).replace("0x", ""),
					stroke: "#" + String(itemStroke).replace("0x", ""),
					strokeThickness: itemStrokeThickness,
					align: itemAlign,
					wordWrap: wordWrap
				};
				if (wordWrap ) style.wordWrapWidth = 240;// dialog-box width - 10 (padding)

				if (itemType === "text") {

						modalLabel = game.add.text(0, 0, content, style);
						modalLabel.contentType = 'text';
						modalLabel.update();
						//modalLabel.x = (centerX - (modalLabel.width / 2)) + offsetX;
						//modalLabel.y = (centerY - (modalLabel.height / 2)) + offsetY;

						//modalLabel.x =( modalX - (modalLabel.width / 2)) + offsetX ;//(centerX - (modalLabel.width / 2)) + offsetX;
					//	modalLabel.y =( modalY - (modalLabel.height / 2))+ offsetY ;// (centerY - (modalLabel.height / 2)) + offsetY;

						modalText = modalLabel;

				} else if (itemType === "bitmapText")  {
					modalLabel = game.add.bitmapText(0, 0, itemFontfamily, String(content), itemFontSize);
					modalLabel.contentType = 'bitmapText';
					modalLabel.align = textAlign;
					modalLabel.updateText();

				} else if (itemType === "image") {

					modalLabel = game.add.image(0, 0, content);
					modalLabel.scale.setTo(contentScale, contentScale);
					modalLabel.contentType = 'image';
					modalLabel.align= itemAlign;
					if (wordWrap) modalImageWrapText = modalLabel;

				} else if (itemType === "tileSprite") {
					itemX = modalX  + offsetX;
					itemY =  modalY + offsetY ;
					//console.log("TILESPRITE ",itemX, itemY, tileSpriteWidth, tileSpriteHeight, content, imageFrame  );
					modalLabel = game.add.sprite(itemX, itemY, content, imageFrame);
					modalLabel.scale.setTo(contentScale, contentScale);
					modalLabel.anchor.setTo(itemAnchor.x, itemAnchor.y);
					modalLabel.angle = itemAngle;
					modalLabel.contentType = 'tileSprite';
				} else if (itemType === "sprite") {
					modalLabel = game.add.sprite(0, 0, atlasParent, content);
					modalLabel.scale.setTo(contentScale, contentScale);
					modalLabel.contentType = 'sprite';
				} else if (itemType === "button") {
					modalLabel = game.add.button(0, 0, atlasParent, callback,
						this, buttonHover, content, buttonActive, content);
					modalLabel.scale.setTo(contentScale, contentScale);
					modalLabel.contentType = 'button';

				} else if (itemType === "graphics") {
					modalLabel = game.add.graphics(graphicW, graphicH);
					modalLabel.beginFill(graphicColor, graphicOpacity);
					if (graphicRadius <= 0) {
						modalLabel.drawRect(0, 0, graphicW, graphicH);
					} else {
						modalLabel.drawRoundedRect(0, 0, graphicW, graphicH, graphicRadius);
					}
					modalLabel.endFill();
				}

				modalLabel.x =( modalX - (modalLabel.width / 2)) + offsetX ;//(centerX - (modalLabel.width / 2)) + offsetX;
				modalLabel.y =( modalY - (modalLabel.height / 2))+ offsetY ;// (centerY - (modalLabel.height / 2)) + offsetY;


				modalLabel._offsetX = 0;
				modalLabel._offsetY = 0;
				modalLabel.lockPosition = lockPosition;
				modalLabel._offsetX = offsetX;
				modalLabel._offsetY = offsetY;


				if (callback !== false && itemType !== "button") {
					modalLabel.inputEnabled = true;
					modalLabel.pixelPerfectClick = true;
					modalLabel.priorityID = 10;
					modalLabel.events.onInputDown.add(callback, modalLabel);
				}

				if (itemType !== "bitmapText" && itemType !== "graphics") {
					modalLabel.bringToTop();
					modalGroup.add(modalLabel);
					modalLabel.bringToTop();
					modalGroup.bringToTop(modalLabel);
				} else {
					modalGroup.add(modalLabel);
					modalGroup.bringToTop(modalLabel);
				}
			}

			if (modalImageWrapText) {
				modalImageWrapText.height = modalText.height + margin * 2;
				modalImageWrapText.width = modalText.width + margin * 2;
				modalImageWrapText.x = modalText.x - margin;
				modalImageWrapText.y = modalText.y - margin;
			}

			modalGroup.visible = false;
			game.modals[type] = modalGroup;
			//console.log("Adding new modal " , game.modals)
		},
		updateModalValue: function (value, type, index, id) {
			var item;
			if (index !== undefined && index !== null) {
				item = game.modals[type].getChildAt(index);
			} else if (id !== undefined && id !== null) {

			}

			if (item.contentType === "text" || item.contentType === "bitmapText") {
				item.text = value;
				item.update();
				if (item.lockPosition === true) {

				} else {
					item.x = ((game.width / 2) - (item.width / 2)) + item._offsetX;
					item.y = ((game.height / 2) - (item.height / 2)) + item._offsetY;
				}
			} else if (item.contentType === "image") {
				item.loadTexture(value);
			}

		},
		getModalItem: function (type, index) {
			return game.modals[type].getChildAt(index);
		},
		showModal: function (type) {
			game.world.bringToTop(game.modals[type]);
			game.modals[type].visible = true;
			// you can add animation here
		},
		hideModal: function (type) {
			game.modals[type].visible = false;
			// you can add animation here
		},
		destroyModal: function (type) {
			game.modals[type].destroy();
			delete game.modals[type];
		}
	};
};
