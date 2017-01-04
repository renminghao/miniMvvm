var isObject = function (target) {
	return Object.prototype.toString.call(target) === 'object Object'
}

var compress = function (exp,scop) {
	try{
		with(scop)
			return eval(exp)
	}catch(e){
		console.error(e);
		return null
	}
}

module.exports =  {
	isObject : isObject,
	compress : compress
}