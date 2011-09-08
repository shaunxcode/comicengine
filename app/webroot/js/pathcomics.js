var PC ={};
			
$(function() {
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
							sketchTools.append("<a href='#frame_sketch_" + id + "' data-size='" + this + "' style='background: #PCc'>" + this + "</a> ");
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
								aPCept: '.Asset',
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
						
						var components = $('<div><ul><li><a href="#tabs-background">Background</a></li><li><a href="#tabs-events">Events</a></li><li><a href="#tabs-data">Data</a></li><li><a href="#tabs-characters">Characters</a></li><li><a href="#tabs-props">Props</a></li></ul></div>')
							.addClass('Components')
							.append($('<div />').attr({id: 'tabs-background'}).append(sketchTools))
							.append($('<div />').attr({id: 'tabs-events'}).append(
								$('<div />').addClass('Assets').append(
									asset('Choice'),
									asset('Click')),
								events.view))
							.append($('<div />').attr({id: 'tabs-data'}))
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
	
	
	var stripid = 0;
	$('#newStripButton').button().click(function() {
		var mapNode = $('<div />').addClass('MapNode');
		map.append(mapNode);
		
		stripid++;
		
		var strip = $('<div />')
			.attr({id: stripid})
			.addClass('Strip')
			.draggable({
				snap: true, 
				drag: function(){ 
					strip.updateMapNode();
				}, 
				scroll: true
			})
			.css({
				top: -$('#workspace').position().top + 260, 
				left: -$('#workspace').position().left + 75
			})
			.append(
				$('<div />').append($('<input />').addClass('StripTitle').val('Title' + stripid)),
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
		
	}).click();
	
	$(window).scrollTop(0).scrollLeft(0).scroll(map.drawScreen);
	
	$('#previewButton').button();
	$('#shareButton').button();
})