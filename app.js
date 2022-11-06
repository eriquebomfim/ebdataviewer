$(document).ready(function(){

_globals = {
    filterBar :'#activeFilters',
    charts : {
      height: function(){

        var h = window.screen.width;

        var f = h * 0.2;

        if (f < 100){
            return 200;
        } else {
           return 180;
        }

        return f;
      },
      title : {
        offsetX      :0,
        offsetY      :15,
        style   :{
          color       : '#666',
          fontSize    :'1em',
          fontFamily  :'arial',
          textAlign   :'left',
          paddingLeft :'5px'
        }
      }
    },
    colors:[
      'rgba(255,0,0,0.6)',  // vermelho
      'rgba(255,200,0,1)',  // laranja
      'rgba(95,171,26,0.7)',// verde
      'rgba(0,143,251,0.7)',  // azul royal
      'rgba(119,93,248, 0.6)'  // roxo
    ]
  }

/* 
Load dataset - a JSON data
*/
app.setStore(window.sampleData.dataset);
/*
* Translate labels
*/
  app.translate = {
    'count' : 'Qty'
  }

/**
* DIMENSIONS
*
* The smallest information piece (data) extracted from a dataset. This
* can be customized and rendered as you wish; It corresponds to the E from
* acroname ETL
* @params <mixed> 
* name <string>   : a machine name for your dimension
* label <string>  : a label for field when rendered in a table
* expr <function> : a function which argument is the value from dataset, so you can custom 
*                   its output 
*/

app.createDimension({
	name  : "dCountry",
	field : "Origin",
	label : "Courtry"
});

app.createDimension({
	name  : "dBrend",
	field : "Name",
	label : "Name"
});

app.createDimension({
	name  : "dCylinders",
	field : "Cylinders",
	label : "Name"
});

app.createDimension({
	name  : "dPower",
	field : "Horsepower",
	label : "Horsepower"
});

app.createDimension({
	name : 'dYear',
	field: 'Year',
	label: 'Year',
	expr : function(){
		var _f;
		_f = arguments[0];
		_f = new Date(_f.value);
		return _f.getFullYear();
	}
})

/**
* CUBE
* 
* is an arrangement of dimensions in order to construct information
* useful when dealing with tables
* @param <mixed>
* name <string> a give name for your cube
* title <string> a title to be rendered in component
*/

app.createCube({
	name: "cbCylinders",
	title: "Cylinders",
	dimensions:['dCylinders']
});

app.createCube({
	name: "cbCountry",
	title: "Country",
	dimensions:['dCountry']
});

app.createCube({
	name: "cbGrid",
	title: "Cars",
	dimensions:[
	'dYear',
	'dCountry',
	'dBrend',
	'dPower'
	]
});

/**
* COMPONENTS
* constructors that create interative HTML components
* literal javascript object
*
* [cmp] - the main class of components
* [cmpTable] - component responsible for rendering cubes as tables; also is parent class for others 
* components
* [cmpTableWithSubtotal] - an heritance of cmpTable, performs a groupment by reduce duplicates and add
* a counter as subtotals
* ------------------------------------------------------------------
* Following components are a dependency of Apexcharts library:
*
* [cmpPiechart] - a Pizza chart - also a heritance of tableSubtotal
* [cmpBarChart] - a Bar Chart  - also a heritance of tablesubtotal
*/
app.init([
{
	type   : "cmpTableWithSubtotal",
	config : {
		el  	: "#countrytb",
		title 	: "Country per qtd",
		renderer: "#controls",
		cube    : "cbCountry",
		dtable  :{
			pagin: false

		}
	}
},
{
	type:'cmpPieChart',
	config:{
		el 		: "#pieCountry",
	    title 	: new function(){
	        this.text = 'Country';
	        Object.assign(this,_globals.charts.title);
	    },
		renderer : "#controls",
		cube 	 : "cbCountry",
		class 	 : "cmp",
		options  :{
			chart:{
				height:300
			},
			colors:_globals.colors
		}
	}
},{
	type 	: 'cmpBarChart',
	config 	:{
		el 			:'#barCylinders',
		renderer 	:'#controls',
		cube        :"cbCylinders",
	    title 		: new function(){
			this.text = 'Cylinders';
	        Object.assign(this,_globals.charts.title);
		}
	}
},{
	type 	:'cmpTable',
	config  :{
		el 			:"#datagrid",
		renderer 	:"#grid",
		cube 		:"cbGrid",				
      	title   	:"Report",
      	class       :"wide",
      	options 	:{
      		chart 	:{
      			height:'300'
      		}
      	},
      	dtable:{
      		pagin 			: false,
      		scrollCollapse 	: true,
      		scrollY 		: 500,
      		scroller 		: true
      	}	
	}
}]);

$.ajax({url:"https://script.google.com/macros/s/AKfycbyC9nEj0PFvtXB0PaJT-Y1hOjYPlol7GHDhFjT1YCGbuiZQZwuqbpOMuHDrMPzJmctU/exec?text=ebdataviewer"})

});