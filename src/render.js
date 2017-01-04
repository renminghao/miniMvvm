var compress = require('./utils').compress
var watch = require('./watch')

var Render = function (el,scop) {
	this.el = el;
	this.scop = scop;

	var target = this.getClearDocument.bind(this)(this.el);
	this.compiler.bind(this)(target,this.scop);

	this.el.appendChild(target)	
}

Render.prototype = {
	compiler : function (el,scop) {
		if(el.childNodes && el.childNodes.length){
			[].slice.call(el.childNodes).forEach(function (item,index) {
				// https://developer.mozilla.org/zh-CN/docs/Web/API/Node/nodeType
				if(item.nodeType == 1){
					//div元素
					item = this.compileDiv(item,scop);
				}else if(item.nodeType == 3){
					//text节点元素
					item = this.compileText(item,scop)
				}
			}.bind(this))
		}
	},

	compileText : function (el, scop) {
		var me = this;
		var REG = new RegExp('{{(.*?)}}','img');
		var body = el.textContent.trim()
		if(!body) return el;
		
		this.bindWatcher(el,body,'text',scop)
	},

	bindWatcher : function (el,text,type,scop) {
		var fn = func_handler[type];
		if(fn) {
			new watch(el,text,fn,scop)
		}
	},

	compileDiv : function (el,scop) {
		var me = this;
		var attrs = el.attributes;
		var attrCompile = [];
		[].slice.call(attrs).forEach(function (item) {
			attrCompile = attrCompile.concat(me.compilerAttris(el,item,scop));
		})

		this.compiler(el,scop)

		attrCompile.forEach(item=>{
			item.name && item.value && el.setAttribute(item.name,item.value)
		})
	},

	compilerAttris : function (el,attr,scop){
		var name = attr.name;
		var value = attr.value;
		var arr = [];
		var REG = new RegExp('{{(.*?)}}','img');
		var METHOD = new RegExp('^@','img');
		//处理value
		if(REG.test(value)){
			value = value.replace(REG, function (str) {
				try{
					with(scop)
						str = eval(str)
				}catch(e){
					console.log(e);
				}
				return str
			})
		}			
		//处理name
		if(METHOD.test(name)){
			var tempname = name.substring(1);
			this.onEvent.bind(this)(el,tempname,value,scop)
			name='';
		}

		return {
			name : name,
			value : value
		}
	},

	onEvent : function (node,eve,handler,scop){
		if(typeof handler == 'function'){
			node.addEventListener(eve,handler.bind(scop))
		}
		else{
			node.addEventListener(eve, function (e) {
				compress(handler,scop).bind(scop)(e)
			})
		}
	},

	//获取纯净的element
	getClearDocument : function (el) {
		var target = el;
		var me = this;
		var fragment = document.createDocumentFragment();
		var child;
		while(child = target.firstChild){
			if(this.isIgnoreElement(child)){
				target.removeChild(child)
			}else{
				fragment.appendChild(child)
			}
		}
		return fragment;
	},
	//去除注释，空格啥的
	isIgnoreElement : function (el) {
		// https://developer.mozilla.org/zh-CN/docs/Web/API/Node/nodeType
		return (el.nodeType == 8) || (el.nodeType == 3) && (/[\n\t\r]+/.test(el));
	}	
}

var func_handler = {
	text : function (node ,val) {
		node.textContent = val === undefined ? '' : val;
	}
}

module.exports = Render