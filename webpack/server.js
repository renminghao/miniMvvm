const webpack = require('webpack');
const webpackDev = require('webpack-dev-server');
const open = require('open');

const config = require('./webpack.config.js')

const compaire = webpack(config);

const app = new webpackDev(compaire, {
	hot : true,
	publicPath : '/static/',
	historyApiFallback : false,
	stats : {color:true},
	headers : {'X-Custom-Header' : 'yes'}
})

app.listen(8080, function (err) {
	console.log('listen...');
	if(err) {console.log(err)}
	open('http://localhost:8080/index.html')
})