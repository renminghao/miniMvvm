###	最少的代码实现最简单的vue

vue目前这么火，不试试水怎么好意思说自己跟的上潮流呢，vue既然用多了，就可以深入下，自己试着来搞一个？

和vue实现的原理一致，我们实现`数据=>视图`只需要劫持Object.defineProperty的get和set方法，这样子在我们对数据进行更新的时候，就可以触发我们自定义的方法，来实现更多的操作

PS. 代码里面用到了`with`来改动作用域，如果用ES6写通过babel-loader转换的时候会给每个文件里面加上`use strict`在严格模式下不能使用`with`等语法，因此这里面的代码都是通过ES5来写的#尴尬脸#

PSS.代码仓库在[这里](https://github.com/renminghao/miniMvvm)

接下来就从头开始看看这部分代码吧

-	[index.js](https://github.com/renminghao/miniMvvm/blob/master/src/index.js)

首先是`index.js`,在浏览器环境里，全局需要使用MVVM变量，因此绑定在window下，得到入参时候，先把所有的data和method数据绑定在this下面，这样子方便我们后续在改变作用域的情况下直接来通过eval执行对应的表达式内容，`bindDataByRender`里面的get里面，通过col.add来收集所有的渲染操作(晕了吧，没事，这里你只要知道有这么个玩意儿就行了),
<pre>```
get : function () {
		window.TARGET && col.add(window.TARGET)
		return obj[item]
},
```</pre>
当然，这里只是设置了每个数据的get和set，并没有真正的去执行，在哪里执行呢,`index.js`里面有一个render，可以深入到render里面来看

-	[render.js](https://github.com/renminghao/miniMvvm/blob/master/src/render.js)

PS.这里只实现了最基本的指令，因此代码量比较少

相比index.js来看render就稍微复杂一点，但真的只是稍微复杂了一点，首先我们得到传进来的el，el可以是构造函数指定的，也可以不指定就直接是document.body了，我们需要将传进来的el“净化”一下，
<pre>```
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
	}
```</pre>
新建一个代码片段，来当做净化后的元素的容器，isIgnoreElement的内容在下面：
<pre>```
	isIgnoreElement : function (el) {
		// https://developer.mozilla.org/zh-CN/docs/Web/API/Node/nodeType
		return (el.nodeType == 8) || (el.nodeType == 3) && (/[\n\t\r]+/.test(el));
	}
```</pre>
可以去[这里](https://developer.mozilla.org/zh-CN/docs/Web/API/Node/nodeType)看下具体的nodeType的内容代表的具体是啥，截止目前，我们已经获取到了一段"纯净"的HTML代码，接下来我们就该compile了，我们遍历当前el的每一个子节点，用每个子节点的nodeType来识别出到底是一个text节点还是一个Element，如果是text节点，那直接去执行我们的绑定操作，如果不是就可以翻译当前节点的attributes，并且执行递归，一直到text节点

我们得到当前节点的attributes，来查看其中内容是否是符合我们的绑定(@event)，然后通过addEventListener来讲对应的事件绑定到这个元素上面，那么，我们又是如何来获取具体绑定的方法呢？
<pre>```
	onEvent : function (node,eve,handler,scop){
		if(typeof handler == 'function'){
			node.addEventListener(eve,handler.bind(scop))
		}
		else{
			node.addEventListener(eve, function (e) {
				compress(handler,scop).bind(scop)(e)
			})
		}
	}
```</pre>
我们里面用到了compress，compress是从utils中来的，我们可以看下代码
<pre>```
var compress = function (exp,scop) {
	try{
		with(scop)
			return eval(exp)
	}catch(e){
		console.error(e);
		return null
	}
}
```</pre>
没错，我们就是通过with来直接读取method中的方法，我们在index.js中将data和method中的每一个元素都绑定到了mvvm的this上面，我们吧mvvm的this当做scop传进来，这里调用with就能够直接获取到对应的方法内容啦

可以吧text节点当做基础类型，Element当做高级类型，我们遍历高级类型到每一个基础类型，而且 我们只处理基础类型

<pre>```
	compileText : function (el, scop) {
		var me = this;
		var body = el.textContent.trim()
		if(!body) return el;
		
		this.bindWatcher(el,body,'text',scop)
	}
```</pre>

如果text节点没有内容，那就直接返回，否则我们做一次绑定
<pre>```
var func_handler = {
	text : function (node ,val) {
		node.textContent = val === undefined ? '' : val;
	}
}

bindWatcher : function (el,text,type,scop) {
		var fn = func_handler[type];
		if(fn) {
			new watch(el,text,fn,scop)
		}
	}
```</pre>
这里用到了watch，看下watch的代码，

-	[watch.js](http://gitlab.alibaba-inc.com/minghao.rmh/mvvm/blob/master/src/watch.js)

watch很简单的，主要就是实现了一次上面`	new watch(el,text,fn,scop)`里面fn的调用，我们查看最新一次的内容和上一次的内容是否一致，如果不一致我们就来执行一遍fn，那fn具体是啥呢，可以追回到[render.js](http://gitlab.alibaba-inc.com/minghao.rmh/mvvm/blob/master/src/render.js#L126)来看,就是当数据不一样的时候我们执行一次渲染，这不就实现了mvvm么？

当然，上面都描述的是编译器，那真正的执行期是啥样子呢，我们可以看到index.js里面，执行期里面只执行了render来进行编译，在编译的时候肯定会使用到我们的变量，这个时候就会触发我们index.js里面的Object.defineProperty里面的get方法，触发一次col.add，我们看下[col](https://github.com/renminghao/miniMvvm/blob/master/src/collect.js)里面又是什么鬼
<pre>```
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
```</pre>
可以看到，整个col就相当于一个仓库，来收集消息和触发消息，我们在渲染的时候将每条数据渲染的上下文进行一次收集，每次手机一个window.TARGET,而这个TARGET在哪里呢，可以看下[watch.js](https://github.com/renminghao/miniMvvm/blob/master/src/watch.js#L16)里面的get,
<pre>```
		window.TARGET = this;
		var val = getCompress(this.content,this.scop)
		window.TARGET = null;
```</pre>

对的，在每次渲染的时候，我们获取数据的同时，在监视器里面讲TARGET暴露出去，这样子我们就确定了当前数据渲染的作用域，和当前数据对应的设置（更新）方法，岂不美哉？再看index.js的[set](https://github.com/renminghao/miniMvvm/blob/master/src/render.js#L46)里面我们在程序自动更新内容的时候，执行了一遍该数据对应的更新内容的触发，这样子就能在数据更新的时候来执行对应的更新方法来更新视图了，是不是很6

基本上整个仓库代码就实现了

0.	数据劫持
0. 	消息绑定
0.  消息触发
0.  更新视图

也是通过上面几个操作，实现了一个最基础的mvvm原型

###	参考资料

-	[https://github.com/vuejs/vue](https://github.com/vuejs/vue)
- 	[https://github.com/qieguo2016/Vueuv](https://github.com/qieguo2016/Vueuv)