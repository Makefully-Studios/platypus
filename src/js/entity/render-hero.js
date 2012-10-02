gws.components['render-hero'] = (function(){
	var component = function(owner, definition){
		this.owner = owner;
		
		// Messages that this component listens for
		this.listeners = [];

		this.addListeners(['layer:render-load','layer:render', 'logical-state']);
		this.stage = undefined;
		for (var x = 0; x < definition.spriteSheet.images.length; x++)
		{
			definition.spriteSheet.images[x] = gws.assets[definition.spriteSheet.images[x]];
		}
		var spriteSheet = new createjs.SpriteSheet(definition.spriteSheet);
		this.anim = new createjs.BitmapAnimation(spriteSheet);
		this.currentAnimation = '';
	};
	var proto = component.prototype;
	
	proto['layer:render-load'] = function(obj){
		this.stage = obj.stage;
		this.stage.addChild(this.anim);
	};
	
	proto['layer:render'] = function(obj){
		this.anim.x = this.owner.x;
		this.anim.y = this.owner.y;
	};
	
	proto['logical-state'] = function(obj){
		if (this.currentAnimation != obj.state)
		{
			this.currentAnimation = obj.state;
			this.anim.gotoAndPlay(obj.state);
		}
	};
	
	// This function should never be called by the component itself. Call this.owner.removeComponent(this) instead.
	proto.destroy = function(){
		this.removeListeners(this.listeners);
	};
	
	/*********************************************************************************************************
	 * The stuff below here will stay the same for all components. It's BORING!
	 *********************************************************************************************************/

	proto.addListeners = function(messageIds){
		for(var message in messageIds) this.addListener(messageIds[message]);
	};

	proto.removeListeners = function(listeners){
		for(var messageId in listeners) this.removeListener(messageId, listeners[messageId]);
	};
	
	proto.addListener = function(messageId, callback){
		var self = this,
		func = callback || function(value){
			self[messageId](value);
		};
		this.owner.bind(messageId, func);
		this.listeners[messageId] = func;
	};

	proto.removeListener = function(boundMessageId, callback){
		this.owner.unbind(boundMessageId, callback);
	};
	
	return component;
})();
