var utils = require('./utils')
var isObject = utils.isObject;
var _ = require('lodash');
var Render = require('./render')

var collect = require('./collect')

var MVVM = function (option) {
	var me = this;
	this.$data = option.data || {};
	this.$el = option.el ? 
				isObject(option.el) ? option.el : document.querySelector(option.el) :
				document.body;

	this.$options = _.assign({},{
		method : {}
	},option);

	this.bindDataByRender.bind(this)(option.data);
	this.bindDataByRender.bind(this)(this.$options.method);

	new Render(me.$el, this)
}

MVVM.prototype = {

	bindDataByRender : function (obj) {
		var me = this;
		_.keys(obj).forEach(function (item){
			var val = obj[item];
			var col = new collect();
			Object.defineProperty(me, item, {

				enumerable : true,

				get : function () {
					window.TARGET && col.add(window.TARGET)
					return obj[item]
				},
				set : function (newval) {

					if(newval == val) return;
					val = newval;//结束死循环的关键
					me.$data[item] = newval;

					col.notify()
				}
			})
		})		
	}
}

window.MVVM = MVVM;

module.exports = MVVM;