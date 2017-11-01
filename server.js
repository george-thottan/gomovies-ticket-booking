var express = require('express');
var app = express();
var crypto = require('crypto');
var mysql= require('mysql');
var async      = require('async');
var session= require('express-session');
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'docterjose',
  database: 'gomovies'
})

connection.connect(function(err) {
  if (err) throw err;
  console.log('You are now connected...');
    });
// set up handlebars view engine
var handlebars = require('express3-handlebars').create({ defaultLayout:'scndry' });
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', process.env.PORT || 3000);
app.use(require('body-parser')());
app.use(express.static(__dirname + '/public'));
app.use(session({
	secret : 'someRandomSecretValueMateyy',
	cookie:{maxAge:1000*60*60*24*30}
}));
app.get('/', function(req, res){
	res.render('GoMovies',{layout : "main"});
});
app.get('/movies',function(req, res){
	if(req.session && req.session.auth && req.session.auth.userId){

    var runnin=1;
    var not_runnin=0;

    var query1 = "SELECT * from movies where status=?";
    var query2 = "SELECT * from movies where status=?";

    var return_data = {};

    async.parallel([
       function(parallel_done) {
           connection.query(query1, runnin, function(err, results) {
               if (err) return parallel_done(err);
               return_data.table1 = results;
               parallel_done();
           });
       },
       function(parallel_done) {
           connection.query(query2, not_runnin, function(err, results) {
               if (err) return parallel_done(err);
               return_data.table2 = results;
               parallel_done();
           });
       }
    ], function(err) {
         if (err) console.log(err);

         res.render('movie',return_data);
    });



	}//res.render('movie',{layout : "scndry"});
	else{
		res.send("Please do login");
	}
});
app.get('/register',function(req, res){
	res.render('register',{layout : "main"});
});


app.get('/movie-page/:id',function(req, res){

  var id = req.params.id;


  connection.query("SELECT * FROM movies WHERE mid=?",[id],function(err,results){
    if (err) throw err;
    if(results.length>0){
      res.render('moviepage',{results: results});
    }
    else{
      res.status(404);
      res.send('srry');
    }
  });
	//res.render('moviepage');
});


function hash(input,salt){
	var hashed = crypto.pbkdf2Sync(input, salt, 10000, 512,'sha512');
	return ["pbkdf2","10000",salt,hashed.toString('hex')].join('$');
}

app.post('/create-user',function(req,res){
		var fname=req.body.fname;
		var lname=req.body.lname;
		var reg_email=req.body.reg_email;
		var pass=req.body.reg_pass;
		var conf_pass=req.body.reg_conf;
		var phone=req.body.phone;
		var salt= crypto.randomBytes(128).toString('hex');
		var dbString=hash(pass,salt);
		var meminfo=[[fname,lname,reg_email,dbString,phone]];
		connection.query("INSERT INTO members(fname,lname,elmail,passwrd,phone) VALUES ?",[meminfo], function(err, results){
		if (err)
			throw err;
		else
			res.send('success');
	});

});

app.post('/signin',function(req,res){
	var sign_email= req.body.s_email;
	var sign_pass= req.body.s_pass;

	connection.query("SELECT * FROM members WHERE elmail=?",[sign_email],function(err, results){
		if (err)
			throw err;
		else
		{

			if(results.length === 0)
			{
				res.send('username/password is invalid');
			}
			else
			{
				var dbString= results[0].passwrd;
				var salt = dbString.split("$")[2];
				var hashpass= hash(sign_pass, salt);
				if(hashpass===dbString)
				{
					req.session.auth={userId : results[0].mem_id}
					res.redirect(303,'/movies');
				}
				else
				{
					res.send('username/password is invalid');
				}
			}
		}
	})
});

app.get('/logout', function(req,res){
	delete req.session.auth;
	res.redirect(303,'/');
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
