var _ = require('lodash');
var collect = function () {
	this.col = {};
}

module.exports = collect;

collect.prototype = {
	add : function (target){
		if(!this.col[target.id]){
			this.col[target.id] = target;
		}
	},
	notify : function (){
		var me = this;
		_.keys(this.col).forEach(function (item){
			me.col[item].set()
		})
	}
}