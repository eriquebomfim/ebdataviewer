/**
* EBDataViewer.js
* An opensource javascript library to help you create business intelligence components
* for web application building
* @author ERIQUE BOMFIM <erique.bomfim@gmail.com July.2019
* @dependences jquery-2.x, apexcharts
*/


	/*
	* compares
	* @description helps you to find similarity of some object and other
	* @obj <mixed> object to be searched for
	* @arr <midex> array of objects
	* @return <boolean> true if object was found in array
	*/

	$.compares = function(obj, arr){

		var rs = false;

		$.each(arr,function(idx, arrayItem){

			var _searchFor = obj;
			var _searchIn  = arrayItem;

			if (
				_searchIn.hasOwnProperty(Object.keys(_searchFor)[0]) &&
				_searchIn[Object.keys(_searchFor)[0]] == _searchFor[Object.keys(_searchFor)[0]]
		  ){
				rs = true;
				arrayItem[$.t('count')] += 1;
				return false;
			}

		});

		return rs;
	}

	$.escapeSpecialChars = function(text){
		text = text.toLowerCase();
    text = text.replace(new RegExp('[ÁÀÂÃ]','gi'), 'a');
    text = text.replace(new RegExp('[ÉÈÊ]','gi'), 'e');
    text = text.replace(new RegExp('[ÍÌÎ]','gi'), 'i');
    text = text.replace(new RegExp('[ÓÒÔÕ]','gi'), 'o');
    text = text.replace(new RegExp('[ÚÙÛ]','gi'), 'u');
    text = text.replace(new RegExp('[Ç]','gi'), 'c');
    return text;
	}

	$.classify = function(data, _filters){

		 var _order,_arr;
		 _arr = data;

		 for (_s in _filters){

			 _arr.sort(function(a,b){

				 _order = _filters[_s]['order'] == 'asc' ? 1 : -1;

			  if ( a[_filters[_s]['field']] < b[_filters[_s]['field']])
					return -1 * _order;
				else
				if ( a[_filters[_s]['field']] > b[_filters[_s]['field']])
					return 1 * _order;
				else
					return 0;

			});

			if (_filters[_s].hasOwnProperty('visible') && !_filters[_s]['visible']){
				 $.each(_arr, function(idx, elem){
					 delete _arr[idx][_filters[_s]['field']];
				 });
			}


		 }

		 return _arr;
	}


	$.sizeOf = function(){
		var _arr = arguments[0];
		var _size = 0;
		$.each(_arr, function(idx, elem){
			_size = idx;
		});
		return _size;
	}
/*
* exists
* @description verifies if a given element already exists in the solution, if not
* a new one is append to the DOM
* @return object
*/
	$.fn.exists = function(){

				if ($(this).length > 0){
						$(this).empty();
						return $(this);
				}

				var cfg;
				var _el = $('<div></div>');

				if (typeof(arguments[0]) == 'object' && arguments[0].hasOwnProperty('el')){

					cfg = arguments[0].el;

				}
				else {
					cfg = this.selector;
				}

				if (cfg.indexOf('.') > -1)
						_el.attr('class', cfg.replace(".",""));

				if (cfg.indexOf('#') > -1)
						_el.attr('id',   cfg.replace("#",""));

				if (typeof(arguments[0]) != 'undefined'){

					if (arguments[0].hasOwnProperty('style'))
					 	_el.css(arguments[0].style);

				  if (arguments &&  arguments[0].hasOwnProperty('class'))
					 	_el.addClass(arguments[0].class);

				}

				if (arguments && arguments[0].hasOwnProperty('attr')){
						_el.attr(arguments[0].attr);
				}

				if (arguments[0].hasOwnProperty('renderer')){
					  _el.appendTo(arguments[0].renderer);
				}
				else {
					 _el.appendTo('body');
				}

				return _el;

	}

	/*
	* enableSelection
	*@description convert element into a link that interacts with application
	*@return link
	*/

	$.fn.enableSelection = function(){
		var elem, html, text,code;
		elem = $(this);
		html = elem.html();
		text = elem.text();
		code = $('<a href="javascript:void(0)"></a>');
		code.click(function(){
			var params = {
				field 		: elem.attr('data-field'),
				component : elem.attr('data-componentName'),
				expr 		  : html
			}
			app.setSelection(params);
		});
		code.html(html);
		elem.html(code);
	}

$(document).ready(function(){

	app = new function(){

		var
		_self,								/* the application itself*/
		_store,								/* original dataset loaded on application start up 	*/
		_selection,						/* data selections are stored in this array 				*/
		_selections,
		_dimensions,			    /* user created dimensions are stored here 					*/
		_dimensionsSet,				/* user dimensions configs stored here 							*/
		_cubes,								/* user created datacubes goes here 								*/
		_createSelection,			/* method to create a data selection                */
		components = []			  /* array of components														  */
		;

		_store 					= [];
		_self  					= this;
		_self['charts'] = {};
		_selection 			= [{data:_store}];
		_selections 		= [];
		_dimensions 		= {};
		_dimensionsSet 	= {};
		_cubes 					= {};
		_cubesSet       = [];

		this.cmps       = {};
		this.t 					= $.t = function(){
			 return _self.translate[arguments[0]];
		}


		/*
		* _getSelection
		*@description retrive a specific data store of data selection
		*@return <object> a dataset
		*/
		_getSelection = function(){

			if (_selection.length > 0){

				var _currentSelection;
				_currentSelection = _selection[_selection.length-1].data;

				return _currentSelection;
			}
			return _selection[0].data;
		}

		/*
		* _createSelection
		*@description reads active dataset and filters datarows according a given
		*criteria
		*@params object containing fields and expression to search dataobjects
		*@return application
		*/
		_createSelection = function(params){

			var expr = params.expr;
			var _newdata = [];
			var _currentSelection;
			_currentSelection = _getSelection();

			for (var j in _currentSelection){
				  if (_currentSelection[j].hasOwnProperty(params.field)
					&&  _currentSelection[j][params.field] == params.expr
				){
					_newdata.push(_currentSelection[j]);
				}
			}

			_selection.push({data:_newdata});

			return this;
		}

		/*
		*@todo find a way to reduce efforce in the creation of datastore based on
		*given dimensions and selection, now having too much loop which reduces
		performance when a big data mass is required
		*/
		_mergeDimensions = function(){

			var _data = [];

			$.each(_dimensionsSet,function(idx, elem){
				$.each(_dimensions[elem.name].store,function(i, field){
					if (typeof(_data[i])=='undefined'){
						_data.push(field);
					} else {
						_data[i] = $.extend(
								_data[i], field
						);
					}
				})
			});

			_selection = [{data:_data}];
		}

		_createDimension = function(cfg){

			_dimensionsSet[cfg.name] = cfg;

			var
			rs,
			_currentSelection,
			_mixedValues,
			_fldName,
			_node,
			_item,
			_value;

			rs = [];
			_currentSelection = _getSelection();

			for (var r in _currentSelection){

				/* we have joined dimension name and field in order to handle
				* dimensions having same data field but different output
				*/
				_fldName = [cfg.name,cfg.field].join("__");

				_node  = _currentSelection[r]
				_item  = _currentSelection[r][cfg.field];
				_value = typeof(_item)!='undefined' ? _item : _currentSelection[r][_fldName];

				/*
				if cfg.field is an array of fields, then we have to bind both fields
				into one only; however, we have to customize their expression individually
				*/

				if (Array.isArray(cfg.field)){
					  _mixedValues = [];
						_fldName 		 = [];
					 	$.each(cfg.field, function(f, _field){
							_xvalue = _currentSelection[r][_field.field];
							_fldName.push(_field.field);
							if (_field.hasOwnProperty('expr')){
								 _xvalue = _field.expr({value:_xvalue, node: _node});
							}
						  _mixedValues.push(_xvalue);
					 });
					 _value = _mixedValues.join("");
					 _fldName = _fldName.join("__");
				}

				if (cfg.hasOwnProperty('expr')){
					 _value = cfg.expr({value:_value, node: _node});
				}

				rs.push(new function(){
						this[_fldName] = _value
				});

			}

			_dimensions[cfg.name] = {
				label: cfg.label,
				field: _fldName,
				store: rs,
				find : function(str){
					var _d = this;
					_rs = false;
					$.each(_d.store,function(i, elem){
						if (elem[_d.field] == str ){
							_rs = true;
							return _rs;
						}
						if (i >= _d.store.length){
							return _rs;
						}
					});

					return _rs;
				}
			};

			return rs;
		}

		/*
		*_createCube
		*@description Cube is a set of dimension arranged in the order of final visua-
		*lization. A Cube can have various dimensions obviousily
		*/
		_createCube = function(cube){
				_cubesSet.push(cube);
				_newCube = new function(){};
				_newCube[cube['name']] = new function(){
						 this.title 		= cube.title;
						 this.dimensions = cube.dimensions;
				}
				_cubes = $.extend(
					_cubes,
					_newCube
				);
		}

		_fetch 	= function(cfg){
			var _cubeName = cfg.cube;
			 var _store = {};
			 var _data  = [];
			 var _fields =[];
			 var _currentSelection = _getSelection(cfg);

			 $.each(_currentSelection, function(id, item){
				 		var queue = {};
						$.each(_cubes[_cubeName].dimensions,function(idx, dimensionName){

							  if (id == 0){
									_fields.push(_dimensions[dimensionName].field);
								}

							 _fld = item[_dimensions[dimensionName].field];
							 queue[_dimensions[dimensionName].label] = _fld;
						});
						_data.push(queue);
			 });

			 _store.data   = _data;
			 _store.fields = _fields;

			 return _store;
		}

		_listSelection = function(obj){

			  var
				_id,
				_filter,
				_filterlabel,
				_filterRemove;

				if (obj.hasOwnProperty('hidden')){
					 return false;
				}

				if (obj.hasOwnProperty('displayField')){
					  obj.label = _selection[_selection.length-1].data[obj.key][obj.displayField];
				}

				_filter 		= $('<div class="btnFilter"></div>');
				_filterlabel 	= $('<span><div>'+obj.component+'</div><div>'+obj.label+'</div></span>').appendTo(_filter);
				_filterRemove = $('<a href="#" data-info="'+obj.key+'">&times;</a>')
				.click(function(){

						_id  = $(this).attr('data-info');
						_self.removeSelection(_id);
						$(this).parent().remove();

				}).appendTo(_filter);

				_filter.appendTo(_globals.filterBar);
		}

		_mount = function(){

 			$(_globals.filterBar).find('.btnFilter').remove();

			for (var sel in _selections){
				var _nSelect = _selections[sel];
				_nSelect.key = sel;
				_createSelection(_nSelect);
				_listSelection(_nSelect);
			}

			for (var dim in _dimensionsSet){
					_createDimension(_dimensionsSet[dim]);
			}

			_self.update();
		}

		/*
		* components
		* @description is a set of components that can be instanciated, some heritance
		* is possible using javascript object knowledge
		*/

		/* cmp
		* @description is the basic component where we define store, fields, labels,
		* series and methods related to components
		* @params
		*/
		components["cmp"] = function(cfg){

				var _cmp   = this;
				var _store = _fetch(cfg);
				this.fields = _store.fields;
				this.store  = _store.data;
				this.title = cfg.title;

				if (cfg.hasOwnProperty('filter')){
					  this.store = $.classify(_store.data, cfg.filter);
				}

				_self.cmps[cfg.el.substr(1)] = _cmp;


				if (cfg.hasOwnProperty('subtotals')){

					var _subtotals = [];
					var _total = 0;

					// calculating subtotals
					$.each (_cmp.store, function(index, element){

						if (!$.compares(element, _subtotals)){
							element[_self.t('count')] = 1;
							_subtotals.push(element);
						}
					});

					this.store = _subtotals;
					this.labels = [];
					this.series = [];
					$.each(this.store,function(i, row){
						 $.each(row, function(j, column){
							  if (j == _self.t('count')){
									 _cmp.series.push(column);
									 _total += column;
								}
								else
								{
									 if (!(column in _cmp.labels))
									  _cmp.labels.push(column);
								}

						 })
					});

				this.dtable = {

						  'footerCallback' : function( row, data, start, end, display){

								  $('head').append('<style>tfoot td{padding:5px 10px !important; background:#ccc; font-weight:bold}</style>')

									var api = this.api(), data;

									var cols = data[0].length - 1;

									var sum = 0;

									$.each(data, function(idx, elem){
										 var _val = elem[elem.length-1];
										 var _rg  = new RegExp(/>(.*?)</) ;
										 sum  += _rg.exec(_val)[1] * 1;
									})

									$( api.column(0).footer()).html('Total');
									$( api.column(cols).footer()).html(sum);

							}
					}
				}
		}

		components["cmpTable"] = function(cfg){

			  components["cmp"].apply(this, arguments);

				var _cmp 					= this;
				var _currentData 	= [];

				var _title        = {};
				if (!cfg.hasOwnProperty('title')){
					  _title = Object.assign(_title, _globals.charts.title);
						_title.text = "";
				} else {
					if (typeof(cfg.title) == 'Object'){
						_title = cfg.title;
						_title = Object.assign(_title, _globals.chart.title);
					} else {
						_title.text = cfg.title;
						_title = Object.assign(_title, _globals.charts.title);
					}
				}

				this.draw = function(){

							var
							_item,
							_id,
							elem,
							header,
							row,
							cell,
							i,
							_columns,
							_dataTable;

							_id = cfg.el;
							_columns 	= [];
							_dataTable = _id + "_dt";
							_dtableCfg = {};

							_item = $(cfg.el).exists(cfg);

							if (cfg.hasOwnProperty('dtable')){

								var _dtableDefaults = {
									paging 		: false,
									searching : false,
									info 			: false,
									language  : {
										search 				: "Pesquisa Inteligente:",
										info   				: "&nbsp;_TOTAL_ registros encontrados.",
										zeroRecords 	: "Nenhum registro foi encontrado!",
										sInfoFiltered : "(filtrado do total de _MAX_ registros)"
									}
								}

								_dtableCfg = $.extend(_dtableDefaults, _cmp.dtable, cfg.dtable);

							}

							elem   			= $('<table></table>');
							elem.attr('id', _id +"_dt");
							elem.append(
								 $('<caption></caption>')
								.html(_title.text)
								.css(_title.style)
							);
							thead 			= $('<thead></thead>');
							theadRow 		= $('<tr></tr>');
							tbody 			= $('<tbody></tbody>');
							tfoot       = $('<tfoot></tfoot>');
							tfootRow 		= $('<tr></tr>');
							i 	   			= 0;

							for (var item in _cmp.store){

								var c = 0;
								var row = $('<tr></tr>');

								for (var col in _cmp.store[item]){

									if (i == 0){
										theadRow.append($('<th>'+col+'</th>'));
										tfootRow.append($('<td></td>'));
									}

									if (
										_currentData[col] != _cmp.store[item][col] ||
										_cmp.store[item][col] == 1 ||
										!cfg.hasOwnProperty('group')
									){
										cell = $('<td></td>');
										cell.html(_cmp.store[item][col]);
										cell.attr('data-field',_cmp.fields[c]);
										cell.attr('data-componentName', _cmp.title + ' ('+col+')');

										if (JSON.stringify(_cmp.store[item]).indexOf("Total") > -1){
											row.addClass('subtotals');
										}
										else {
												 	cell.enableSelection();
										}
										_currentData[col] = _cmp.store[item][col];

									} else {
										cell = $('<td class="ghost"></td>');
									}
									row.append(cell);
									c++;
								}
								tbody.append(row);
								i++;
							}
							thead.append(theadRow);
							tfoot.append(tfootRow);
							elem.append(thead);
							elem.append(tbody);
							elem.append(tfoot);
							$(_item).html(elem);

							elem.DataTable(_dtableCfg);


				}


		}

		components["cmpTableWithSubtotal"] = function(cfg){

				arguments[0].subtotals = true;
				components["cmpTable"].apply(this, arguments);

		}

		components["cmpPieChart"] = function(cfg){

			var _cmp = this;

			components["cmpTableWithSubtotal"].apply(this, arguments);


			this.draw = function(){


				var options = {
            chart: {
                type: 'pie',
								events:{
									dataPointSelection:function(event, chartContext, config){

										var obj = config.w.config;
										var selectedItem = config.dataPointIndex;
										var _expr = obj.labels[selectedItem];

										_self.setSelection({
											field:_cmp.fields[0],
											expr :_expr,
											component: cfg.title.text
										})

									}
								}
            },
						title : cfg.title,
            labels: _cmp.labels,
            series: _cmp.series
        }

				if (cfg.hasOwnProperty('options')){
					 var _opt;
					 _opt = {};
					 $.extend(true, _opt, options, cfg.options);

					 if ( !cfg.options.colors.length ){
							 var _newcolors = [];
							 $.each(_cmp.labels, function(i, e){
									if (typeof(cfg.options.colors[e])!='undefined'){
										 _newcolors.push(cfg.options.colors[e]);
									}
							 });
							 _opt.colors = _newcolors;
					 }

					 options = _opt;
				}


				if ($(cfg.el).length == 0){

						$(cfg.el)
						.exists(cfg)
						.html('<div class="apexcharts-canvas light">');

		        var _chart = new ApexCharts(
		            document.querySelector(cfg.el),
		            options
		        );

		        _chart.render();

						_self['charts'][cfg.cube] = _chart;

					} else {

						_chart = _self['charts'][cfg.cube];
						_opts  = options;
						_chart.updateOptions( _opts);

					}

			}
		}

		components["cmpBarChart"] = function(cfg){

			components["cmpTableWithSubtotal"].apply(this, arguments);

			var _cmp = this;

			this.draw = function(){

				var options = {
						chart: {
								height		: 219,
								width			: 300,
								type			: 'bar',
								maxItems  : 8,
								toolbar   :{show:false},
								events:{
									dataPointSelection:function(event, chartContext, config){

										var obj 					= config.w.config;
										var selectedItem 	= config.dataPointIndex;
										var _expr 			 	= obj.xaxis.categories[selectedItem];

										_self.setSelection({
											field:_cmp.fields[0],
											expr :_expr,
											component: cfg.title.text
										});

									}
								}
						},
						plotOptions: {
								bar: {
										horizontal: true,
										barPadding:'50px'
								}
						},
						dataLabels: {
								enabled: true,
								position:'center',
								hideOverflowingLabels:true
						},
						series: [{
								data: _cmp.series
						}],
						xaxis: {
							type : 'categories',
								categories: _cmp.labels,
								labels : {
									position:'right'
								}
						}
				}

				if (cfg.hasOwnProperty('options')){
					 var _opt;
					 _opt = {};
					 $.extend(true, _opt, options, cfg.options);
					 options = _opt;
				}


				if (options.chart.hasOwnProperty('maxItems')){

						if (options.plotOptions.bar.horizontal){

								options.chart.height = _self.fitBarSize({
									barMeasure : options.chart.height,
									maxItems   : options.chart.maxItems,
									totalItems : _cmp.labels.length
								});


							$.extend(true, cfg, {
								style : {
								'overflow-y' :'scroll',
								'overflow-x' :'hidden'
								}
							});


						} else {

							options.chart.width = _self.fitBarSize({
								barMeasure : options.chart.width,
								maxItems   : options.chart.maxItems,
								totalItems : _cmp.labels.length
							});

						}

				}

					if ($(cfg.el).length == 0){

					  $(cfg.el)
						.exists(cfg);

		        var chart = new ApexCharts(
		            document.querySelector(cfg.el),
		            options
		        );

						chart.render();

						_self['charts'][cfg.cube] = chart;

					} else {

						_chart = _self['charts'][cfg.cube];
						_chart.updateOptions(options);

					}

					if (cfg.hasOwnProperty('title')){
							 var _title = $('<div></div>')
							 .css($.extend({
								 'position' 				:'absolute',
								 'background-color' :'#fff',
								 'padding-top'     	: '4px'
							 },cfg.title.style))
							 .html(cfg.title.text)
							 .prependTo(cfg.el);
					 }

			}
		}

		components["cmpCombobox"] = function(cfg){

			var _self = this;

			 components["cmpTableWithSubtotal"].apply(this, arguments);

			 this.draw = function(){

				  var
					_idx,
					_element,
					_cbox,     /* HTML select */
					_cboxItem, /* HTML selection option*/
					_label;

					_cboxClear = "";
					if (typeof(app.getSelectionByComponentName(cfg.title)) == 'object'){
						_cboxClear = $('<a href="javascript:void(0)" title="limpar" class="btnClear">&times;</a>');
						_cboxClear.click(function(){
							app.removeSelectionByComponentName(cfg.title);
						});
					}
				  _cbox = $('<select></select>');
					_cbox.attr('id', cfg.el.replace("#","")+"_cmp");
					_label = $('<caption></caption>').html(cfg.title);

					_cboxItem = $('<option></option>');
					_cboxItem.attr('value','all');
					_cboxItem.html($.t('Select'));
					_cboxItem.appendTo(_cbox);

					$.each(_self.store, function(_idx, _element){

						_cboxItem = $('<option></option>');
						_cboxItem.attr('value', _element[cfg.valueField]);
						_cboxItem.html(_element[cfg.displayField] + ' ('+_self.series[_idx]+')');
						_cboxItem.appendTo(_cbox);

						if (cfg.hasOwnProperty('defaultSelected')){
							  cfg.defaultSelected(_cbox);
						}
					});

					if (cfg.hasOwnProperty('events')){
						  $.each(cfg.events,function(idx, fn){
								_cbox.bind(idx,fn);
							});
					} else {
						 console.debug("You didn't provide an event for this component");
					}

					$(cfg.el)
					.exists(cfg)
					.html([_label,_cbox,_cboxClear]);

			 }
		}

		this.fitBarSize = function(config){

			  var
				_fitMeasure, 	/* calculated height -----------------------------------*/
				_barMeasure, 	/* default barchart height -----------------------------*/
				_numElements; /* quantity of elements of chart -----------------------*/

				_fitMeasure   = 0;
				_barMeasure   = config.barMeasure;
				_numElements  = config.totalItems;
				_max 				  = config.maxItems  ;
				_fitMeasure   = (_barMeasure / _max) * _numElements;
				_fitMeasure   = _fitMeasure > _barMeasure ? _fitMeasure : _barMeasure;

				return _fitMeasure;

		}

		this.enabledUndoButton = function(){
				$('<a href="javascript:void(0)" id="btnUndoSel"></a>')
				.exists()
				.html('<i class="fa fa-reply"></i>')
				.click(app.undoSelection)
				.prependTo('body')
		}

		this.init = function(cpnts){

			this.cfg = cpnts;

			if (_globals.hasOwnProperty('undoButton'))
					this.enabledUndoButton();

			_mergeDimensions();

			_store = _selection;

			this.draw();

		}

		this.draw = function(){

			var
			cpnts,	/* all components to be created 					*/
			cmp,    /* current instance of a component 				*/
			el,     /* html config of the component 					*/
			type,   /* the type of component will be created 	*/
			conf;

			cpnts = this.cfg;

			/* looping in the set of components to be created */

			for ( var component in cpnts ){

				el 		= cpnts[component].config.el;
				type  = cpnts[component].type;
				conf  = cpnts[component].config;
			  cmp 	= new components[type](conf);
				cmp.draw();
			}

			app.selection  = _selection[_selection.length - 1];

		}

		/* repaint components */
		this.update = function(){
			var _self = this;
			_self.draw(_self.cfg);
		}

		this.getSelection = function(sid){

			return {
					sid: sid,
					obj:_selections[sid]
			}
		}

		/* public methods */
		this.setSelection 	 = function(conf){

			 var _rs = JSON.stringify(_selections);

			 conf.label = conf.expr;

			 if (conf.expr == 'all'){
				 this.clearSelections();
				 return true;
			 }

			 if (_rs.indexOf( conf.field ) > -1  ){
				 return false;
			 }

			 _selections.push(conf);

			 _mount();
		};

		this.getSelectionByComponentName = function(componentName){

			var _self = this;
			try {
				if (_selections.length > 0){
					for (var _idx = 0; _selections.length; _idx++ ){
						 if (_selections[_idx].component == componentName){
							   return _self.getSelection(_idx);
							   break;
						 }
					}
				}
			}catch(err){

			}

			return false;

		}

		/* remove a selection */
		this.removeSelection = function(sid){
			_selection =  _selection.slice(0,1);
			_selections = _selections.filter(function(v, x, arr){
				return x != sid;
			});
			_mount();

		}

		this.removeSelectionByComponentName = function(componentName){
			 var _sel;
			 _sel = this.getSelectionByComponentName(componentName);
			 if (_sel.hasOwnProperty('sid')){
				 this.removeSelection(_sel.sid);
			 }
		}

		/* clear all selections */
		this.clearSelections = function(){
			_selections = [];
			if (_selection.length > 1){
				_selection  = _selection.slice(0,1);
				_mount();
			}
		}

		/* remove last selection */
		this.undoSelection = function(){
			if (_selections.length > -1){
				  _selection =  _selection.slice(0,1);
					_selections = _selections.slice(0,_selections.length-1);
					_mount();
			}
		}

		this.setStore         = function(dataset){
					_store 		 = dataset;
					_selection = [{data:_store}];
		}
		this.selection        = _selection[0];
		this.selections       = _selections;
		this.createDimension 	= _createDimension;
		this.dimensionsSet    = _dimensionsSet;
		this.createCube 		  = _createCube;
		this.dimensions      	= _dimensions;
		this.cubes 				    = _cubes;

	};

});
