var express = require('express');
var app = express();
var handlebars = require('express3-handlebars').create({ defaultLayout:'themain' });
var mysql= require('mysql');
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'gomovies'
})

connection.connect(function(err) {
  if (err) throw err;
  console.log('You are now connected...');
    });
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', process.env.PORT || 8080);

app.use(express.static(__dirname + '/public'));
const fileUpload = require('express-fileupload');
app.use(fileUpload());
app.use(require('body-parser')());

app.get('/', function(req,res){
	res.render('sen',{ title: 'hi there'});
})

app.post('/upload', function(req, res) {
	var mname= req.body.mname;
	var message= req.body.message;
	var stat= req.body.stat;
	var num;
	if (!req.files.sampleFile)
    return res.status(400).send('No files were uploaded.');

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
	let sampleFile = req.files.sampleFile;

  // Use the mv() method to place the file somewhere on your server
	sampleFile.mv(__dirname+'/public/img/uploads/'+sampleFile.name, function(err) {
    if (err)
      return res.status(500).send(err);
	if(stat== 'running')
		num=1;
	else
		num=0;
	var minfo= [[req.body.mname,sampleFile.name,req.body.message,num]];
	connection.query("INSERT INTO movies(name,img,abt,status) VALUES ?",[minfo], function(err, results, fields){
		if (err)
			throw err;
		else
			res.send('File uploaded!');
	});

  });
});

// custom 404 page
app.use(function(req, res){
	res.type('text/plain');
	res.status(404);
	res.send('404 - Not Found');
});

// custom 500 page
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.type('text/plain');
	res.status(500);
	res.send('500 - Server Error');
});

app.listen(app.get('port'), function(){
	console.log( 'Express started on http://localhost:' +
	app.get('port') + '; press Ctrl-C to terminate.' );
});
