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
					data += '&api_token=' + api.token;
				} else {
					data.api_token = api.token;
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
				if(data.many) { 
					newData.many = data.many;
				} else {
					newData[method] = data;	
				}
				
				data = newData;
			}
			api.request('post', method, data, callback);
		},
		uploadFile: function(img) {
			$('<form />').attr({enctype: 'multipart/form-data', method: 'POST'}).append(
				$('<input />').attr({type: 'file'}));
		}
	};
	
	$.each(['User', 'World', 'Comic', 'Strip', 'Frame', 'Asset', 'Character', 'CharacterImage'], function(i, noun) {
		api[noun] = {
			post: function(data, callback) {
				if(typeof data != 'string' && !data[noun]) {
					var newData = {};
					newData[noun] = data;
					data = newData;
				}
				api.post(noun, data, callback);
			},
			postMany: function(data, callback) {
				api.post(noun, {many: data}, callback);
			},
			getById: function(id, callback) {
				api.get(noun + '/' + id, '', callback);
			},
			get: function(data, callback) {
				api.get(noun, data, callback);
			},
			put: function(data, callback) {
				api.put(noun, data, callback);
			},
			putMany: function(data, callback) {
				api.put(noun, {many: data}, callback);
			}
		}
	});
	
	PC.strips = {
		update: function() {
			var combo = $('#startingFrameCombo').html('');
			$.each(user.strips, function(i, strip) {
				combo.append($('<option />').attr('value', strip.id).text(strip.name));
			});
			combo.val(user.comics[user.activeComic].start_strip_id);
		}
	};
	
	PC.frames = {};
	
	PC.scrollTo = function(parent, child) {
		parent.animate({
			left: parent.position().left - (child.offset().left - 550),
			top: parent.position().top - (child.offset().top -550)})

	};
	
	PC.frameId = 0;
	PC.canvasId = 0; 
	
	PC.drawFrame = function(strip, record, activeFrame, prepend) {
		var frame =  $('<img />')
			.attr({
				'id': 'frame_' + record.id, 
				src: '/assets/' + record.id + '/frame.png'})
			.addClass('Frame')
			.hover(function() {
				$('.Frame').removeClass('ActiveFrame');
				$('.FrameTools').remove();
				$(this).addClass('ActiveFrame');
				
				var tools = $('<div />').addClass('FrameTools'); 

				tools.append(
					$('<button />').text('+').button().css('float', 'left').click(function(){
						newFrame(strip, frame, true);
					})); 
					
				tools.append(
					$('<button />').text('edit').button().click(function() {
						api.Frame.getById(record.id, function(result) {
							var sketchTools = $('<div />').addClass('SketchTools');
							$.each(['#f00', '#ff0', '#0f0', '#0ff', '#00f', '#f0f', '#000', '#fff'], function() {
								sketchTools.append("<a href='#frame_sketch_" + record.id + "' data-color='" + this + "' style='width: 10px; height: 10px; background: " + this + ";'>&nbsp;</a> ");
						    });
					
						    $.each([1, 2, 3, 5, 10, 15], function() {
								sketchTools.append("<a href='#frame_sketch_" + record.id + "' data-size='" + this + "' style='background: #ccc'>" + this + "</a> ");
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
									$('<canvas />').attr({width: 500, height: 500, 'id': 'frame_sketch_' + record.id}));

							var eventLayer = $('<div />')
								.attr({id: 'tabs-events_layer'})
								.addClass('Layer EventLayer')
								.droppable({
									accept: '.Asset',
									drop: function(evt, ui) {
										events.add({
											type: ui.draggable.data('type'), 
											xpos: Math.floor(ui.offset.left - eventLayer.offset().left), 
											ypos: Math.floor(ui.offset.top - eventLayer.offset().top), 
											width: ui.helper.width(), 
											height: ui.helper.height(), 
											value: ''
										});
									}
								});
																
							var events = {
								models: [],
								add: function(event) {
									event.view = $('<div />')
										.addClass('Event event-' + event.type)
										.draggable({
											containment: 'parent',
											drag: function(evt, ui) {
												ui.helper.css({left: ui.position.left, top: ui.position.top})
											},
											stop: function(evt, ui) {
												event.xpos = Math.floor(ui.position.left);
												event.ypos = Math.floor(ui.position.top);
												$('.XposCell', event.view.row).text(event.xpos);
												$('.YposCell', event.view.row).text(event.ypos);
											}
										})
										.css({
											top: event.ypos + 'px', 
											left: event.xpos + 'px', 
											width: event.width + 'px', 
											height: event.height + 'px'})
										.resizable({
											stop: function() {
												event.width = event.view.width();
												event.height = event.view.height();
												$('.WidthCell', event.view.row).text(event.width);
												$('.HeightCell', event.view.row).text(event.height);
											}
										});
									
									eventLayer.append(event.view);
									
									//in thoory this would just be for type of "choice"
									if(event.type == 'choice') { 
										var valueControl = $('<select />');
										$.each(user.strips, function(i, strip) {
											valueControl.append($('<option />').attr('value', strip.id).text(strip.name));
										});
										valueControl.val(event.value);
									} else {
										var valueControl = $('<input />').attr('type', 'text').val(event.value); 
									}
										
									event.view.row = $('<tr />')
										.append(
											$('<td />').addClass('TypeCell').text(event.type),
											$('<td />').addClass('XposCell').text(event.xpos),
											$('<td />').addClass('YposCell').text(event.ypos),
											$('<td />').addClass('WidthCell').text(event.width),
											$('<td />').addClass('HeightCell').text(event.height),
											$('<td />').addClass('DataCell').html(valueControl));
									$('tbody', events.view).append(event.view.row);
									
									event.value = function() {
										var value = {};
										value[event.type] = valueControl.val();
										return value;
									};
									
									events.models.push(event);
								},
							
								view: $('<table><thead><tr><th>type</th><th>x pos</th><th>y pos</th><th>width</th><th>height</th><th>value</th></thead><tbody></tbody></table>')
							};
												
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
								.append($('<div />').attr({id: 'tabs-characters'}).append(
									$('<button />').text('Add Character').button().click(function(){
										
									}), 
									$('<div />').addClass('CharacterList')))
								.append($('<div />').attr({id: 'tabs-props'}))
								.tabs({
									select: function(evt, ui) {
										layers.bringToTop($(ui.tab).attr('href') + '_layer');
									}
								}).tabs('select', 0); 
							
							PC.canvasId++;
							var flatBg = $('<canvas />').attr({id: 'flatBg' + PC.canvasId, width: 500, height: 500}).addClass('Layer'); 
							
							var characters = {
								add: function(character) {
									character.view = $('<div />')
										.append($('<img />').attr({
											src: character.value.src,
											width: character.width,
											height: character.height}))
										.css({
											position: 'absolute', 
											zIndex: 800, 
											background: 'transparent',
											width: (character.width + 20) +  'px',
											height: (character.height ) + 'px',
											left: character.xpos + 'px',
											top: character.ypos + 'px'
										})
										.draggable()
										.transformable({
											skew: function() { return false },
											scale: function(evt, ui) { ui.scalex = ui.scaley },
											scaleStart: function(evt, ui) { console.log('yo'); console.log(ui); },
											scaleStop: function(evt, ui) { console.log('bro'); console.log(ui); }
										});
									
									characterLayer.append(character.view);
								}
							};
							
							var characterLayer = $('<div  />')
								.addClass('Layer Characters_layer')							
								.droppable({
									accept: '.Character',
									drop: function(evt, ui) {
										characters.add({
											type: 'character',
											xpos: Math.floor(ui.offset.left - characterLayer.offset().left), 
											ypos: Math.floor(ui.offset.top - characterLayer.offset().top), 
											width: ui.helper.width(),
											height: ui.helper.height(),
											value: {src: ui.helper.attr('src')}
										});
									}
								});
							
							layers.append(eventLayer, flatBg);
							
							layers.append(backgroundLayer, characterLayer);
							
							var frameEditorDialog = $('<div />')
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
										$('#frame_sketch_' + record.id).sketch({
											stopPaintingCallback: function(sketch) {
												artisan.drawImage('flatBg' + PC.canvasId, document.getElementById('frame_sketch_' + record.id).toDataURL('png'), 0, 0, 500, 500);
												setTimeout(function(){ sketch.actions = [] }, 100);
											}
										});
										
										if(result.assets) {
											$.each(result.assets, function(i, asset) {
												if(asset.type == 'background') { 
													result.bg = asset;
													artisan.drawImage('flatBg' + PC.canvasId, '/assets/'  + record.id + '/' + asset.id + '.png?rand=' + (new Date().getTime()), 0, 0, 500, 500);
												}
												
												if(asset.type == 'event') {
													//get first key
													for(var type in asset.value) break;
													events.add({
														id:	asset.id,
														type: type, 
														xpos: asset.xpos, 
														ypos: asset.ypos, 
														width: asset.width, 
														height: asset.height, 
														value: asset.value[type]
													});
												}
											})
										}
										
										$.each(['breadwig', 'spiderman', 'elephant'], function(i, char) {
											$('.CharacterList').append($('<img />').attr({
												src: '/assets/characters/' + char + '.png'
											})
											.draggable({
												revert: true,
												helper: 'clone'
											})
											.data('type', 'character')
											.addClass('Character'))
										})
										
									},
									buttons: {
										Cancel: function() {
											$(this).dialog('close');
										}, 
										Save: function() {
											var png = artisan.convertTo.PNG('flatBg' + PC.canvasId); 
											
											frame
												.attr('src', png);

											var create = [];											
											var update = [];

											var options = {
												frame_id: record.id,
												xpos: 0, 
												ypos: 0,
												width: 500, 
												height: 500,
												layer: 1, 
												type: 'background',
												image: png
											};

											if(result.bg) {
												options.id = result.bg.id;
												update.push(options);
											} else {
												create.push(options);
											}
																						
											if(events.models.length) {
												$.each(events.models, function(i, m) {
													var rec = {
														frame_id: record.id, 
														xpos: m.xpos,
														ypos: m.ypos,
														width: m.width,
														height: m.height,
														layer: 2, 
														type: 'event',
														value: m.value(), 
													};
													
													if(m.id) {
														rec.id = m.id;
														update.push(rec);
													} else {
														create.push(rec);
													}
												});
											}
											
											if(create.length) {
												api.Asset.postMany(create);
											}
											
											if(update.length) {
												api.Asset.putMany(update);
											}
											
											frameEditorDialog.dialog('close');
										}
									}});
					})
				}));
					
				tools.append($('<button />').text('clone').button());
				tools.append(
					$('<button />').text('x').button().click(function(){
						frame.parent().remove();
						strip.css('width', strip.width() - (250 + 10 + 2));
						strip.updateMapNode();
				}));
				
				tools.append($('<button />').text('+').button().css('float', 'right' ).click(function(){
					newFrame(strip, frame);
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
				$('<div />').append($('<input />').addClass('StripTitle').val(record.name)
					.keyup(function(evt) {
						if(evt.keyCode == 13) {
							$(this).blur();
						}
						if(evt.keyCode == 27) {
							$(this).val(record.name);
							$(this).blur();
						}
					})
					.blur(function() {
						if(!$(this).val().length) {
							alert('The strip must have at least a one character name');
							$(this).val(record.name);
							return;
						}
						
						if(record.name != $(this).val()) { 
							record.name = $(this).val();
							api.Strip.put({id: record.id, name: record.name}, function(result) {
								user.strips[record.id].name = record.name;
								PC.strips.update();
							});
						}
					})),
				$('<ul />'));
		
		strip.record = record;
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
		
		if(strip.record.frames) {
			$.each(strip.record.frames, function(id, frame) {
				PC.drawFrame(strip, frame);
			});
		}
		
		return strip;
	};
	
	$('#logoutButton').button().click(function(){
		
	});
	
	var newFrame = function(strip, activeFrame, prepend) {
		api.Frame.post({
				strip_id: strip.record.id
			}, 
			function(result) {
				if(result.id) {
					strip.record.frames[result.id] = result;
					PC.drawFrame(strip, result, activeFrame, prepend);
				}
			});
	};
	
	$('#newStripButton').button().click(function() {
		api.Strip.post({
				xpos: -$('#workspace').position().left + 75, 
				ypos: -$('#workspace').position().top + 260, 
				comic_id: user.activeComic
			}, 
			function(result){
				if(result.id) {
					user.strips[result.id] = result;
					result.frames = {};
					newFrame(drawStrip(result));
				}
			});
	});
	
	$(window).scrollTop(0).scrollLeft(0).scroll(map.drawScreen);
	
	$('#previewButton').button().click(function(){
		var previewModal = $('<div />')
			.addClass('PreviewModal')
			.html($('<div />').addClass('PreviewInner'))
			.dialog({
				title: 'Preview',
				modal: true, 
				width: 550, 
				height: 550,
				resizable: false,
				draggable: false
			});
			
	});
	
	$('#shareButton').button();
	
	var initComic = function(comic_id) {
		$('.WorldName').text(user.worlds[user.activeWorld].name + ':');
		$('.ComicName').text(user.comics[user.activeComic].name);
		user.strips = {};
		api.Strip.get({comic_id: comic_id}, function(result){
			$.each(result, function(i, strip) {
				if(!strip.frames) {
					strip.frames = {};
				}
				
				user.strips[i] = strip;
				drawStrip(strip);
			});
			PC.strips.update();
		});
	};
	
	var newComic = function(world_id) {
		var newComicDialog = $('<div />').html(
			$('<form />')
				.addClass('NewComicForm')
				.append(
					$('<p />').text('What should your new comic be called?'),
					$('<div />').append(
						$('<label />').text('Your Comic Name:'),
						$('<input />').attr({type: 'hidden', name: 'Comic[user_id]', value: user.id}),
						$('<input />').attr({type: 'hidden', name: 'Comic[world_id]', value: world_id}),
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
	
	var initWorld = function(world_id) {
		api.Comic.get({world_id: world_id}, function(result) {
			if(result.length == 0) {
				newComic(world_id)
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
						$('<input />').attr({type: 'hidden', name: 'World[user_id]', value: user.id}),
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
						if(result.api_token) {
							api.token = result.api_token;
							initUser(result);
							registerDialog.dialog('close');
						}
					});
				},
				'Login to My Account': function() {
					api.get('authenticate', $('form', registerDialog).serialize(), function(result) {
						if(result.api_token) {
							api.token = result.api_token;
							initUser(result);
							registerDialog.dialog('close');
						}
					});
				}
			}
		});
		
	var initUser = function(record) {
		user = record;
		
		$.cookie('api_token', user.api_token, {expires: 7});
		
		api.World.get({user_id: record.id}, function(result) {
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
	
	if($.cookie('api_token')) {
		api.get('authenticateByToken', {api_token: $.cookie('api_token')}, function(result) {
			if(result.api_token) {
				api.token = result.api_token;
				initUser(result);
			} else {
				registerDialog.dialog('open');
				$.cookie('api_token', null);
			}
		});
	} else {	
		if (!api.token) {
			registerDialog.dialog('open');
		}
	}
});