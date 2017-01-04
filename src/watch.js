var compress = require('./utils').compress
var id = 0;

var watch = function (el,content,fn,scop) {
	this.content = content
	this.el = el;
	this.id = id++;
	this.fn = fn || function (){}
	this.scop = scop;
	this.set()
}

module.exports = watch

watch.prototype = {
	get : function (tag) {
		window.TARGET = this;
		var val = getCompress(this.content,this.scop)
		window.TARGET = null;
		return val;
	},

	set : function (){
		var val = this.get();
		if(val !== this.content){
			this.fn && this.fn(this.el,val);
		}
	}	
}

var getCompress = function (exp,scop) {
	var REG = new RegExp('{{(.*?)}}','img');
	if(REG.test(exp)){
		exp = exp.replace(REG, function (str){
			str = str.replace(/[\{\}]/img,'');
			str = compress(str,scop)
			return str
		})
	}

	return exp;
}