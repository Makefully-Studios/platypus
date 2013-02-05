/**
# COMPONENT **dom-element**
This component creates a DOM element associated with the entity. In addition to allowing for CSS styling, the element can also perform as a controller accepting click and touch inputs and triggering associated messages on the entity.

## Dependencies:
- [[Handler-Render-Dom]] (on entity's parent) - This component listens for a render "handle-render-load" message with a DOM element to setup and display the element.

## Messages

### Listens for:
- **handle-render-load** - This event provides the parent DOM element that this component will require for displaying its DOM element.
  > @param message.element (DOM element) - Required. Provides the render component with the necessary DOM element parent.
- **handle-render** - On each `handle-render` message, this component checks to see if there has been a change in the state of the entity. If so (and updateClassName is set to true in the JSON definition) it updates its className accordingly.
- **logical-state** - This component listens for logical state changes and updates its local record of states.
  > @param message (object) - Required. Lists various states of the entity as boolean values. For example: {jumping: false, walking: true}. This component retains its own list of states and updates them as `logical-state` messages are received, allowing multiple logical components to broadcast state messages.
- **update-content** - This message updates the innerHTML of the DOM element.
  > @param message.text (string) - Required. The text that should replace the DOM element's innerHTML.

### Local Broadcasts:
- **[Messages specified in definition]** - Element event handlers will trigger messages as defined in the JSON definition.
  > @param message (DOM Event object) - When messages are triggered on the entity, the associated message object is the DOM Event object that was provided to the originating DOM Event handler.

## JSON Definition
    {
      "type": "dom-element",

      "element": "div",
      //Required. Sets what type of DOM element should be created.
      
      "innerHTML": "Hi!",
      //Optional. Sets the DOM element's inner text or HTML.
      
      "className": "top-band",
      //Optional. Any standard properties of the element can be set by listing property names and their values. "className" is one example, but other element properties can be specified in the same way.
      
      "updateClassName": true,
      //Optional. Specifies whether the className of the DOM element should be updated to reflect the entity's logical state. This setting will cause the className to equal its setting above followed by a space-delimited list of its `true` valued state names.
      
      "onmousedown": "turn-green",
      //Optional. If specified properties begin with "on", it is assumed that the property is an event handler and the listed value is broadcast as a message on the entity where the message object is the event handler's event object.

      "onmouseup": ["turn-red", "shout"]
      //Optional. In addition to the event syntax above, an Array of strings may be provided, causing multiple messages to be triggered in the order listed.
    }
*/
platformer.components['dom-element'] = (function(){
	var createFunction = function(message, entity){
		if(typeof message === 'string'){
			return function(e){
				entity.trigger(message, e);
				e.preventDefault();
			};
		} else {
			return function(e){
				for (var i = 0; i < message.length; i++){
					entity.trigger(message[i], e);
				}
				e.preventDefault();
			};
		}
	},
	component = function(owner, definition){
		var elementType = definition.element   || 'div';
		
		this.owner = owner;
		this.updateClassName = definition.updateClassName || false;
		this.className = '';
		this.states = {};
		this.stateChange = false;
		
		// Messages that this component listens for
		this.listeners = [];
		this.addListeners(['handle-render-load', 'handle-render', 'update-content', 'logical-state']);
		
		this.element = this.owner.element = document.createElement(elementType);
		this.element.ondragstart = function() {return false;}; //prevent element dragging by default

		for(var i in definition){
			if(i === 'style'){
				for(var j in definition[i]){
					this.element.style[j] = definition[i][j]; 
				}
			} else if((i !== 'type') && (i !== 'element') && (i !== 'updateClassName')){
				if(i.indexOf('on') === 0){
					this.element[i] = createFunction(definition[i], this.owner);
				} else {
					this.element[i] = definition[i];
					if(i == 'className'){
						this.className = definition[i];
					}
				}
			}
		}
		
		if(this.owner.className){
			this.className = this.element.className = this.owner.className;
		}
		if(this.owner.innerHTML){
			this.element.innerHTML = this.owner.innerHTML;
		}
	};
	var proto = component.prototype;
	
	proto['handle-render-load'] = function(resp){
		if(resp.element){
			this.parentElement = resp.element;
			this.parentElement.appendChild(this.element);

			if(this.owner.entities){
				var message = {};
				for (var item in resp){
					message[item] = resp[item];
				}
				message.element = this.element;
				for (var entity in this.owner.entities){
					this.owner.entities[entity].trigger('handle-render-load', message);
				}
			}
		}
	};
	
	proto['handle-render'] = function(resp){
		var i     = 0,
		className = this.className;
		
		if(this.stateChange && this.updateClassName){
			for(i in this.states){
				if(this.states[i]){
					className += ' ' + i;
				}
			}
			this.element.className = className;
			this.stateChange = false;
		}
	};
	
	proto['update-content'] = function(resp){
		if(resp && resp.text && (resp.text !== this.element.innerHTML)){
			this.element.innerHTML = resp.text;
		}
	};
	
	proto['logical-state'] = function(state){
		for(var i in state){
			if(this.states[i] !== state[i]){
				this.stateChange = true;
				this.states[i] = state[i];
			}
		}
	};
	
	// This function should never be called by the component itself. Call this.owner.removeComponent(this) instead.
	proto.destroy = function(){
		this.removeListeners(this.listeners);
		if(this.parentElement){
			this.parentElement.removeChild(this.element);
			this.parentElement = undefined;
		}
		if(this.owner.element === this.element){
			this.owner.element = undefined;
		}
		this.element = undefined;
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
		func = callback || function(value, debug){
			self[messageId](value, debug);
		};
		this.owner.bind(messageId, func);
		this.listeners[messageId] = func;
	};

	proto.removeListener = function(boundMessageId, callback){
		this.owner.unbind(boundMessageId, callback);
	};
	
	return component;
})();