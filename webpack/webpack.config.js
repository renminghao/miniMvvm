var path = require('path')
module.exports = {
	entry : {
		index : './src/index.js'
	},
	output : {
		filename : '[name].js',
		path : path.join(__dirname , '../', 'build'),
    publicPath : '/static/',
		library: '[name]',
		libraryTarget: 'umd',
		umdNamedDefine: true
	},
	module : {
		loaders : [
		{
			test : /\.less$/,
			loaders : ['style','css','less']
		}]
	}
}
