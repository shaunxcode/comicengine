var PC ={};
			
$(function() {
	window.user = false;
	
	window.api = {
		token: false,
		callbackHandler: function(callback) {
			return function(result){
				if(result.exception) {
					alert(result.exception);
				} 
				
				if(callback) {
					callback(result);
				}
			};
		},
		request: function(httpmethod, apimethod, data, callback) {
			if(api.token) {
				if(typeof data == 'string') {
					data += '&apiToken=' + api.token;
				} else {
					data.apiToken = api.token;
				}
			}
			
			$[httpmethod]('/api/' + apimethod, data, api.callbackHandler(callback));
		},
		
		post: function(method, data, callback) {
			api.request('post', method, data, callback);
		},
		get: function(method, data, callback) {
			api.request('get', method, data, callback);
		},
		put: function(method, data, callback) {
			if(typeof data == 'string') {
				data += '&_method=PUT';
			} else {
				var newData = {_method: 'PUT'};
				newData[method] = data;
				data = newData;
			}
			api.request('post', method, data, callback);
		}
	};
	
	$.each(['User', 'World', 'Comic', 'Strip', 'Frame', 'Asset', 'Character', 'CharacterImage'], function(i, noun) {
		api[noun] = {
			post: function(data, callback) {
				api.post(noun, data, callback);
			}, 
			get: function(data, callback) {
				api.get(noun, data, callback);
			},
			put: function(data, callback) {
				api.put(noun, data, callback);
			}
		}
	});
		
	PC.frames = {};
	
	PC.scrollTo = function(parent, child) {
		parent.animate({
			left: parent.position().left - (child.offset().left - 550),
			top: parent.position().top - (child.offset().top -550)})

	};
	
	PC.frameId = 0;
	
	PC.newFrame = function(strip, activeFrame, prepend) {
		var id = PC.frameId++;
		var frame =  $('<img />')
			.attr('id', 'frame_' + id)
			.addClass('Frame')
			.hover(function(){
				$('.Frame').removeClass('ActiveFrame');
				$('.FrameTools').remove();
				$(this).addClass('ActiveFrame');
				
				var tools = $('<div />').addClass('FrameTools'); 

				tools.append(
					$('<button />').text('+').button().css('float', 'left').click(function(){
						PC.newFrame(strip, frame, true);
					})); 
					
				tools.append(
					$('<button />').text('edit frame').button().click(function() {
						
						var sketchTools = $('<div />').addClass('SketchTools');
						$.each(['#f00', '#ff0', '#0f0', '#0ff', '#00f', '#f0f', '#000', '#fff'], function() {
							sketchTools.append("<a href='#frame_sketch_" + id + "' data-color='" + this + "' style='width: 10px; height: 10px; background: " + this + ";'>&nbsp;</a> ");
					    });
					
					    $.each([1, 2, 3, 5, 10, 15], function() {
							sketchTools.append("<a href='#frame_sketch_" + id + "' data-size='" + this + "' style='background: #ccc'>" + this + "</a> ");
					    });
					
						var layers = $('<div />').addClass('LayersContainer');
								
						layers.bringToTop = function(layerId) {
							$('.Layer', layers).css('zIndex', 10);
							$(layerId, layers).css('zIndex', 11);
						};
						
						var backgroundLayer = $('<div />')
							.addClass('Layer BackgroundLayer')
							.attr({id: 'tabs-background_layer'})
							.append(
								$('<canvas />').attr({width: 500, height: 500, 'id': 'frame_sketch_' + id}));
						
						var events = {
							add: function(event) {
								event.view.row = $('<tr />')
									.append(
										$('<td />').addClass('TypeCell').text(event.type),
										$('<td />').addClass('XposCell').text(event.xpos),
										$('<td />').addClass('YposCell').text(event.ypos),
										$('<td />').addClass('WidthCell').text(event.width),
										$('<td />').addClass('HeightCell').text(event.height),
										$('<td />').addClass('DateCell').html($('<input />').attr('type', 'text')));
								$('tbody', events.view).append(event.view.row);
							},
							
							view: $('<table><thead><tr><th>type</th><th>x pos</th><th>y pos</th><th>width</th><th>height</th><th>value</th></thead><tbody></tbody></table>')
						};
						
						var eventLayer = $('<div />')
							.attr({id: 'tabs-events_layer'})
							.addClass('Layer EventLayer')
							.droppable({
								accept: '.Asset',
								drop: function(evt, ui) {
									var x = Math.floor(ui.offset.left - eventLayer.offset().left);
									var y = Math.floor(ui.offset.top - eventLayer.offset().top);
									
									var view = $('<div />')
										.addClass('Event event-' + ui.draggable.data('type'))
										.draggable({
											containment: 'parent',
											stop: function(evt, ui) {
												$('.XposCell', view.row).text(Math.floor(ui.position.left));
												$('.YposCell', view.row).text(Math.floor(ui.position.top));
											}
										})
										.css({top: y, left: x})
										.resizable({
											stop: function() {
												$('.WidthCell', view.row).text(view.width());
												$('.HeightCell', view.row).text(view.height());
											}
										});
										
									eventLayer.append(view);
									
									events.add({
										type: ui.draggable.data('type'), 
										xpos: x, 
										ypos: y, 
										width: view.width(), 
										height: view.height(), 
										data: '', view: view});
								}
							})
						
						var asset = function(name) {
							return $('<div />')
								.addClass('Asset')
								.text(name)
								.data('type', name.toLowerCase())
								.draggable({
									revert: true, 
									helper: 'clone'});
						};
						
						var components = $('<div><ul><li><a href="#tabs-background">Background</a></li><li><a href="#tabs-characters">Characters</a></li><li><a href="#tabs-props">Props</a></li><li><a href="#tabs-text">Text</a></li><li><a href="#tabs-events">Events</a></li></ul></div>')
							.addClass('Components')
							.append($('<div />').attr({id: 'tabs-background'}).append(sketchTools))
							.append($('<div />').attr({id: 'tabs-events'}).append(
								$('<div />').addClass('Assets').append(
									asset('Choice'),
									asset('Click')),
								events.view))
							.append($('<div />').attr({id: 'tabs-text'}))
							.append($('<div />').attr({id: 'tabs-characters'}))
							.append($('<div />').attr({id: 'tabs-props'}))
							.tabs({
								select: function(evt, ui) {
									layers.bringToTop($(ui.tab).attr('href') + '_layer');
								}
							}).tabs('select', 0); 
						
						layers.append(eventLayer, backgroundLayer);
						
						$('<div />')
							.append(components, layers)
							.dialog({
								title: 'Edit Frame',
								modal: true, 
								width: 1000, 
								height: 610,
								resizable: false,
								close: function() {
									$(this).remove();
								},
								open: function() {
									$('#frame_sketch_' + id).sketch();
									if(frame.data('actions')) {
										$('#frame_sketch_' + id).sketch('actions', frame.data('actions'));
											$('#frame_sketch_' + id).sketch('redraw');
									}		
								},
								buttons: {
									Cancel: function() {
										$(this).dialog('close');
									}, 
									Save: function() {
										frame
											.attr('src', document.getElementById('frame_sketch_' + id).toDataURL('png'))
											.data('actions', $('#frame_sketch_' + id).sketch('actions'));
										$(this).dialog('close');
									}
								}});
					}));
					
				tools.append(
					$('<button />').text('x').button().click(function(){
						frame.parent().remove();
						strip.css('width', strip.width() - (250 + 10 + 2));
						strip.updateMapNode();
				}));
				
				tools.append($('<button />').text('+').button().css('float', 'right' ).click(function(){
					PC.newFrame(strip, frame);
				}));
				
				$(this).parent().append(tools);
			});
		
		strip.css('width', strip.width() + 250 + 10 + 2);
		var newLi = $('<li />').append(frame);
		if(activeFrame) {
			activeFrame.parent()[prepend ? 'before' : 'after'](newLi);
		} else {
			$('ul', strip).prepend(newLi);
		}
		
		strip.updateMapNode();
		
	//	PC.scrollTo($('#workspace'), frame);
		frame.click();
	};
					
	var map = $('#map');
	
	map.click(function(evt){
		$(window).scrollLeft(0).scrollTop(0);
		var left = evt.clientX - map.position().left;
		var top = evt.clientY - map.position().top;
		if(left + map.screen.width() > map.width()) {
			left = map.width() - map.screen.width();
		}
		if(top + map.screen.height() > map.height()) {
			top = map.height() - map.screen.height();
		}
		map.screen.animate({
			top: top,
			left: left
		});
		workspace.animate({
			top: -map.scaleUp(top),
			left: -map.scaleUp(left)
		})
	});
	
	map.scale = function(n) { 
		var scaled = n * 0.02;
		return scaled < 1 ? 1 : Math.ceil(scaled);	
	};
	
	map.scaleUp = function(n) {
		var scaled = n * 50;
		return scaled; 	
	}
	
	map.screen = $('<div />').addClass('MapScreen').appendTo(map).draggable({
		containment: '#map',
		drag: function(evt, ui) {
			workspace.css({
				top: -map.scaleUp(ui.position.top),
				left: -map.scaleUp(ui.position.left) 
			})
		}
	});
	
	map.drawScreen = function() {
		var wspos = $('#workspace').position();
		map.screen.css({
			left: map.scale(-wspos.left + $(window).scrollLeft()),
			top: map.scale(-wspos.top + $(window).scrollTop()), 
			width: map.scale($(window).width()),
			height: map.scale($(window).height()) 
		});
	};

	var workspace = $('#workspace').draggable({drag: map.drawScreen});
					
	$(window).resize(map.drawScreen).resize();
	
	var drawStrip = function(record) {
		var mapNode = $('<div />').addClass('MapNode');
		map.append(mapNode);

		var strip = $('<div />')
			.attr({id: 'strip' + record.id})
			.addClass('Strip')
			.draggable({
				snap: true, 
				drag: function() { 
					strip.updateMapNode();
				}, 
				stop: function() {
					var pos = strip.position();
					api.Strip.put({id: record.id, xpos: pos.left, ypos: pos.top});
				},
				scroll: true
			})
			.css({
				top: record.ypos + 'px', 
				left: record.xpos + 'px'
			})
			.append(
				$('<div />').append($('<input />').addClass('StripTitle').val(record.name)),
				$('<ul />'));
		
		strip.updateMapNode = function() {
			var pos = strip.position();
			mapNode.css({
				left: map.scale(pos.left), 
				top: map.scale(pos.top),
				width: map.scale(strip.width()),
				height: map.scale(strip.height())
			})
		};
		
		$('#workspace').append(strip);
		
		PC.newFrame(strip);
	};
	
	$('#newStripButton').button().click(function() {
		api.Strip.post({
			Strip:{
				xpos: -$('#workspace').position().left + 75, 
				ypos: -$('#workspace').position().top + 260, 
				comicId: user.activeComic}
			}, 
			function(result){
				if(result.id) {
					user.strips[result.id] = result;
					drawStrip(result);
				}
			});
	});
	
	$(window).scrollTop(0).scrollLeft(0).scroll(map.drawScreen);
	
	$('#previewButton').button();
	$('#shareButton').button();
	
	var initComic = function(comicId) {
		user.strips = {};
		api.Strip.get({comicId: comicId}, function(result){
			$.each(result, function(i, strip) {
				user.strips[i] = strip;
				drawStrip(strip);
			});
		});
	};
	
	var newComic = function(worldId) {
		var newComicDialog = $('<div />').html(
			$('<form />')
				.addClass('NewComicForm')
				.append(
					$('<p />').text('What should your new comic be called?'),
					$('<div />').append(
						$('<label />').text('Your Comic Name:'),
						$('<input />').attr({type: 'hidden', name: 'Comic[userId]', value: user.id}),
						$('<input />').attr({type: 'hidden', name: 'Comic[worldId]', value: worldId}),
						$('<input />').attr({type: 'text', name: 'Comic[name]'}))))
			.dialog({
				modal: true,
				width: 400,
				closeOnEscape: false, 
				draggable: false, 
				resizable: false, 
				open: function() {
					$('.ui-dialog-titlebar', newComicDialog).hide();
				},
				buttons: {
					'Create Comic': function()  {
						api.Comic.post($('form', newComicDialog).serialize(), function(result){
							if(result.id) {
								user.comics = {};
								user.comics[result.id] = result;
								user.activeComic = result.id;
								initComic(user.activeComic);
								newComicDialog.dialog('close');
							}
						})
					}
				}
			});
	};
	
	var initWorld = function(worldId) {
		api.Comic.get({worldId: worldId}, function(result) {
			if(result.length == 0) {
				newComic(worldId)
			} else {
				user.comics = result;
				for(first in result) break;
				user.activeComic = first;
				initComic(user.activeComic);
			}
		});
	};
	
	var newWorld = function() {
		var newWorldDialog = $('<div />').html(
			$('<form />')
				.addClass('NewWorldForm')
				.append(
					$('<p />').text('Welcome to Path Comics. It looks like this is your first time here. Every comic takes place in a world - what is yours called?'),
					$('<div />').append(
						$('<label />').text('Your World Name:'),
						$('<input />').attr({type: 'hidden', name: 'World[userId]', value: user.id}),
						$('<input />').attr({type: 'text', name: 'World[name]'}))))
			.dialog({
				modal: true,
				width: 400,
				closeOnEscape: false, 
				draggable: false, 
				resizable: false, 
				open: function() {
					$('.ui-dialog-titlebar', newWorldDialog).hide();
				},
				buttons: {
					'Create World': function()  {
						api.World.post($('form', newWorldDialog).serialize(), function(result){
							if(result.id) {
								user.worlds = {};
								user.worlds[result.id] = result;
								user.activeWorld = result.id;
								newWorldDialog.dialog('close');
								initWorld(user.activeWorld);
							}
						})
					}
				}
			});
	};
	
	var registerDialog = $('<div />').html(
		$('<form />')
			.append(
				$('<div />').append(
					$('<label />').text('email:'),
					$('<input />').attr({type: 'text', name: 'User[email]'})),
				$('<div />').append(
					$('<label />').text('password:'),
					$('<input />').attr({type: 'password', name: 'User[password]'}))))
		.dialog({
			autoOpen: false,
			modal: true,
			width: 400,
			closeOnEscape: false, 
			draggable: false, 
			resizable: false, 
			dialogClass: 'DialogNoTitle',
			buttons: {
				'Create a New Account': function()  {
					api.User.post($('form', registerDialog).serialize(), function(result) {
						if(result.apiToken) {
							api.token = result.apiToken;
							initUser(result);
							registerDialog.dialog('close');
						}
					});
				},
				'Login to My Account': function() {
					api.get('authenticate', $('form', registerDialog).serialize(), function(result) {
						if(result.apiToken) {
							api.token = result.apiToken;
							initUser(result);
							registerDialog.dialog('close');
						}
					});
				}
			}
		});
		
	var initUser = function(record) {
		user = record;
		
		$.cookie('apiToken', user.apiToken, {expires: 7});
		
		api.World.get({userId: record.id}, function(result) {
			if(result.length == 0) {
				newWorld();
			} else {
				user.worlds = result;
				for(first in result) break;
				user.activeWorld = first;
				initWorld(user.activeWorld);
			}
		})
	};
	
	if($.cookie('apiToken')) {
		api.get('authenticateByToken', {apiToken: $.cookie('apiToken')}, function(result) {
			if(result.apiToken) {
				api.token = result.apiToken;
				initUser(result);
			} else {
				registerDialog.dialog('open');
				$.cookie('apiToken', null);
			}
		});
	} else {	
		if (!api.token) {
			registerDialog.dialog('open');
		}
	}
});