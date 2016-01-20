//-----------------------------------------------------------------------------
// node.js webserver 
// Author: Viren Velacheri
// Notes: 
//  1. passport is express middleware to handle OAuth2 logins 
//  2. swig is the template engine
//-----------------------------------------------------------------------------    
var passport = require('passport');
var flash = require('express-flash');
var _ = require('underscore');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var methodOverride = require('method-override')
var session = require('express-session')
var expressValidator = require('express-validator');
var searchStringToMongoQuery = require('./searchStringToMongoQuery.js');

//Consolidate+swig template engine
var cons = require('consolidate');
var swig = require('swig');

var app = express();

var petdb = require('./PetDb');
var userdb = require('./UserDb');

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;

var config = require('./oauth.js')

var mailgun = require('mailgun-js')({apiKey: config.mailgun.api_key,domain: config.mailgun.domain});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('.html',cons.swig);
//swig.init({root: __dirname + '/views'});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride());
app.use(expressValidator());
app.use(session({secret:'982734ajdlkfjaf',
	resave: true,
	saveUninitialized: true}));
app.use(passport.initialize());
app.use(flash());
app.use(passport.session());

//Connect to the pet database
//Mongo Lab
var database = process.env.MONGOLAB_URI || 'scrapy' ;

//Mongo HQ, compose.io
//var database = process.env.MONGOHQ_URL || 'scrapy' ;

petdb  = new  PetDb(database,'pets' );
userdb = new UserDb(database,'users');

// seralize and deseralize
passport.serializeUser(function(user, done) {
	console.log("serializeUser ::user = " + JSON.stringify(user));
	console.log("serializeUser ::user = " + user.oauthID);
	done(null, user.oauthID);
});

passport.deserializeUser(function(id, done) {
	console.log("deserializeUser ::id = " + id);
	userdb.find({'oauthID': id}, function(err,result){
		console.log("deserializeUser =" + JSON.stringify(result[0]));
		if(!err) done(null, result[0]);
		else done(err, null);
	})
//  console.log("deserializeUser ::obj = " + JSON.stringify(obj));
//  done(null, obj);
});

passport.use(new GoogleStrategy({
    //all valid scopes
    //scope: 'https://www.googleapis.com/auth/plus.me',
    //scope: 'profile',
    //scope: 'openid',
    clientID: config.google_oauth2.clientID,
    clientSecret: config.google_oauth2.clientSecret,
    callbackURL: config.google_oauth2.callbackURL
},function(accessToken, refreshToken, profile, done) {
	console.log("profile = " + JSON.stringify(profile));

	userdb.find({ oauthID: profile.id }, function(err, users) {
		if(err) {
			console.log(err);
			return done(err,null);
		}
		if (!err && users.length != 0) {
			done(null, users[0]);
		} else {

			if ( profile['id'] == undefined )
				return done(err,null) ;

			if ( profile['displayName'] == undefined )
				return done(err,null) ;

			if ( profile['emails'] == undefined )
				return done(err,null) ;

			var newuser = {
				oauthID: profile['id'],
				name: profile['displayName'],
				email: profile['emails'][0]['value'],
				created: Date.now(),
				no:[],
				yes:[],
				search:[]
			};

			userdb.save(newuser,function(err) {
				if(err) {
					console.log(err);
					return done(err,null);
				} else {
					console.log("saving user ...");
					done(null, newuser);
				};
			});
		};
	});
}));

passport.use(new FacebookStrategy({
	clientID: config.facebook.clientID,
	clientSecret: config.facebook.clientSecret,
	callbackURL: config.facebook.callbackURL,
	profileFields : ['emails', 'first_name', 'last_name']
},
function(accessToken, refreshToken, profile, done) {
	console.log("profile = " + JSON.stringify(profile));
//    return done(null,profile);

	userdb.find({ oauthID: profile.id }, function(err, users) {
		if(err) {
			console.log(err);
			return done(err,null) ;
		}

		if (!err && users.length != 0) {
			done(null, users[0]);
		}
		else {

			if ( profile['id'] == undefined )
				return done(err,null) ;

			if ( profile['name'] == undefined )
				return done(err,null) ;

			if ( profile['emails'] == undefined )
				return done(err,null) ;

			var newuser = {
				oauthID: profile['id'],
				name: profile.name.givenName + ' ' + profile.name.familyName,
				email: profile['emails'][0]['value'],
				created: Date.now(),
				no:[],
				yes:[],
				search:[]
			};

			userdb.save(newuser,function(err) {
				if(err) {
					console.log(err);
					return done(err,null);
				} else {
					console.log("saving user ...");
					done(null, newuser);
				};
			});
		};
	});
}));
//---------------------------------------------

app.get('/auth/google',
	passport.authenticate('google', { scope: ['email','profile'] }),
	function(req, res){
	});

app.get('/auth/google/callback',
	passport.authenticate('google', { failureRedirect: '/login' }),
	function(req, res) {
		res.redirect(req.session.returnTo || '/');
	});

app.get('/auth/facebook',
	passport.authenticate('facebook', { scope: ['email'] }),
	function(req, res){
	});

app.get('/auth/facebook/callback',
	passport.authenticate('facebook', { failureRedirect: '/facebook_login_err_page' }),
	function(req, res) {
		res.redirect(req.session.returnTo || '/');
	});

app.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
});

app.get('/facebook_login_err_page' , function(req,res) {
		res.render("error.html",
		{ message: "Facebook login error, did you approve the profile permissions (name,email) requested. Alternatively try using your google login"
		});
});

app.get('/google_login_err_page' , function(req,res) {
		res.render("error.html",
		{ message: "Google login error, did you approve the profile permissions (name,email) requested. Alternatively try using your facebook login"
		});
});

//Expect this to be an Ajax call
app.get('/unsubscribe', function(req, res){
  //Find user id and delete from users dB.
  userdb.deleteUser( req.user['name'] , function() {
  	req.logout();
  	res.json({status:'success'});
  });
});

// test authentication
function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) { return next(); }
//  req.flash('info','to be on account page, you have to be authenticated');
console.log("Not authenticated, returning to login page");
req.session.returnTo = req.originalUrl ;
console.log("req.session.returnTo = " + req.session.returnTo);
res.redirect('/login');
}

app.get('/login', function(req,res) {
	res.render('login.html');
});

//Home page
app.get('/', function(req,res) {
	res.render('home.html');
});

//Expect this to be ajax call
app.get('/savesearch', ensureAuthenticated, function(req,res) {
	console.log("req.query.search = " + req.query.search);
	var username = req.user['name'];
    //var query = searchStringToMongoQuery(req.query.search);
    var query = { 'id' : 123 } ;
    userdb.saveSearch(username,req.query.search,query, function(err) {
    	if ( err ) {
    		console.log("error saving search");
    		res.json({status:'fail'});
    	}
    	else {
    		res.json({status:'success'});
    	}
    });
});

app.get('/deletesearch', ensureAuthenticated, function(req,res) {
	console.log("deletesearch::req.query.search = " + req.query.search);
	var username = req.user['name'];
	var query = searchStringToMongoQuery(req.query.search);
	userdb.deleteSearch(username,req.query.search,query,function(err) {
		if ( err ) {
			console.log("deletsearch::error deleting search");
			res.json({status:'fail'});
		}
		else {
			console.log("deletsearch::success");
			res.json({status:'success'});
		}
	});
});

//Expect this to be ajax call
app.get('/getsearch', ensureAuthenticated, function(req,res) {
	console.log("req.query.search = " + req.query.search);
	var username = req.user['name'];
	userdb.getSearch(username,function(err,docs) {
		if ( err ) {
			console.log("error getting search");
			res.json({status:'fail',result:null});
		}
		else {
			res.json({status:'success',result:docs});
		}
	});
});

//Expect this to be ajax call
app.get('/getMyList', ensureAuthenticated, function(req,res) {
	var username = req.user['name'];
	userdb.getMyList(username,function(err,docs) {
		if ( err ) {
			console.log("error getting search");
			res.json({status:'fail',result:null});
		}
		else {
			console.log('getMyList = ' + JSON.stringify(docs));
			res.json({status:'success',result:docs});
		}
	});
});

app.get('/get_image.asp', ensureAuthenticated, function(req,res) {
	res.redirect('http://www.petharbor.com' + req.originalUrl);
});

app.get('/site.asp', ensureAuthenticated, function(req,res) {
//	res.redirect('http://www.petharbor.com' + req.originalUrl);
	res.render('location.html');
});

app.get('/browse/site.asp', ensureAuthenticated, function(req,res) {
//	res.redirect('http://www.petharbor.com' + req.originalUrl);
	res.render('location.html');
});

//Expect this to be ajax call
app.get('/getDetailsById', ensureAuthenticated, function(req,res) {
	console.log("req.query.id = " + req.query.id);
	petdb.getBySearch({id:req.query.id},function(err,docs) {
		var result ;
		if ( err )
			result = "<p> Error finding details </p>";
		else {
			result = "<p>" +  docs[0]['details'].join('\n') + "</p>";
	    //Remove img url from details, strings are immutable in Javascript
	    //unlike array splice, slice does not modify original string
	    var start = result.indexOf('<td align=');
	    var end = result.indexOf('/td>',start);
	    result = result.slice(0,start) + result.slice(end+4);
	    start = result.indexOf('<td width=');
	    end = result.indexOf('/td>',start);
	    result = result.slice(0,start) + result.slice(end+4);
			result = result.replace("www.youtube.com","http://www.youtube.com");
	}

	console.log("result = " + JSON.stringify(result));
	console.log("original URL = " + req.originalUrl);
	res.send(result);
});
});

app.get('/browse/www.youtube.com', function(req,res) {
		console.log('req.baseUrl =' + req.baseUrl);
		console.log('req.path =' + req.path);
		res.send("junk");
});

//Expect this to be ajax call
app.get('/savepref', ensureAuthenticated, function(req,res) {
	var pref = req.query.pref.toString();
	var id = req.query.id.toString();
	var remove = parseInt(req.query.remove) ;

	console.log("req.query.pref = " + pref);
	console.log("req.query.id = " + id);
	console.log("req.query.remove = " + remove);

	var username = req.user['name'];
	userdb.savePref(username,pref,id,remove,function(err) {
		if ( err ) {
			console.log("error saving search");
			res.json({status:'fail'});
		}
		else {
			res.json({status:'success'});
		}
	});
});

//Expect this to be ajax call
app.get('/getpref', ensureAuthenticated, function(req,res) {
	var username = req.user['name'];
	userdb.getPref(username, function(err,docs) {
		if ( err ) {
			res.json({status:'fail', result: null});
		}
		else {
			res.json({status:'success', result:docs});
		}
	});
});

app.post("/postContact" , function(req, res) {

  req.assert('name', 'Name cannot be blank').notEmpty();
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('message', 'Message cannot be blank').notEmpty();

  var errors = req.validationErrors();

  if (errors) {
		console.log("errors in form validator")
    req.flash('errors', errors);
    return res.redirect('/#contact');
  }

  var from = req.body.email;
  var name = req.body.name;
  var body = req.body.message;

	var data = {
		from: 'postmaster@sandbox4b933ab0e05f44c6acc33fbe4890134b.mailgun.org',
		to: [ 'viren.velacheri@gmail.com' , 'vj.sananda@gmail.com' ],
		subject: 'Contact Form | Koko Wants A Home'
	};

	data['text'] = "Email from: " + from + " (" + name + ")\n" + body ;

	mailgun.messages().send(data, function (err, body) {
		if (err) {
			req.flash('errors', { msg: err.message });
			return res.redirect('/contact');
		}
		req.flash('success', { msg: 'Email has been sent successfully!'});
		res.redirect('/');
	});

});

//Main browse page
app.get('/browse' , ensureAuthenticated, function(req,res) {

	console.log('req.baseUrl =' + req.baseUrl);
	console.log('req.path =' + req.path);

	var username = req.user['name'];
	console.log("username = " + username);

	var and_query = {};
	var list_flag = 0;
	var no_result_msg = "Search returned no results" ;

	if (req.query.search == "" || req.query.search === undefined) {
		console.log("req.query.search not defined");
		if ( req.query.list != "" && typeof req.query.list != 'undefined' ) {
			if ( req.query.list != 'no-favorites-saved')
				and_query['id'] = { '$in' :  req.query.list  } ;
			else {
				no_result_msg = "No dogs saved to favorites list";
				and_query['id'] = { '$in' :  [req.query.list]  } ;
			}
			list_flag = 1;
		}
	}
	else
		and_query = searchStringToMongoQuery(req.query.search);

	console.log(JSON.stringify(and_query));
    //console.log(JSON.stringify(req.query.search));

    var result_valid_flag = true ;
    petdb.getBySearch( and_query , function(err,result){
    	if (err) {
	    //res.send('petdb.getBySearch() returned an Error');
	    //res.send('Search returned no results');
	    result_valid_flag = false;
	  }

	//Retrieve any saved searches
	var saved_search_valid_flag = true ;
	var username = req.user['name'];
	userdb.getSearch(username,function(err,docs) {

		var saved_searches_result = docs[0]['search'];

		if (err) saved_search_valid_flag = false ;

		if (saved_searches_result.length == 0) {
			saved_search_valid_flag = false ;
		}
		else {
			saved_searches_result = _.map( saved_searches_result, function(str) { return (str == "") ? "Any" : str;} );
		//console.log("saved_searches = " + JSON.stringify(saved_searches_result));
	}

	userdb.getPref(username,function(err,pref_result) {

		if (err) console.log("userdb.getPref call failed");
		var today = new Date();

		if ( result_valid_flag ) {
			pref_result = pref_result[0];
		    //console.log('pref_result = ' + JSON.stringify(pref_result));

		    for (var i=0;i<result.length;i++) {
		    	var filter_flag = parseInt(req.query.filter);
		    	result[i]['display'] = true ;

			//Pets added today 'classified' as Added Today.
			//While we work out bug in code
			//result[i]['today'] = sameDay(today,result[i]['date']);
			result[i]['today'] = false ;

			//console.log('result[i][id] =' + result[i]['id']);
			if ( _.contains(pref_result['yes'],result[i]['id'])) {
				result[i]['yes']=true;
			    //console.log("Found id in yes set");
			}
			else {
				if (_.contains(pref_result['no'],result[i]['id'])) {
					if ( filter_flag == 1 ) result[i]['display'] = false;
					result[i]['no'] = true ;
				//console.log("Found id in no set");
			}
		}
			//if filter on, override above and do not display if adopted is true
			if ( filter_flag == 1 &&
				'adopted' in result[i] &&
				result[i]['adopted'] == 'true' )
				result[i]['display'] = false ;
		}
	}

		//console.log('result = ' + JSON.stringify(result));

		//Render page
		res.render('table.html',
		{
			username: username,
			saved_search_valid : saved_search_valid_flag,
			saved_searches: saved_searches_result,
			search_term:req.query.search,
			result_valid:result_valid_flag,
			pets:result,
			filter:req.query.filter,
			list: list_flag,
			no_result_msg: no_result_msg
		});
	});
});
});
});

//Return true if date1 and date2 are the same day
//time does not matter
function sameDay(date1,date2) {
	if ( date1 == undefined || date2 == undefined)
		return false;
	else
		return  ( date1.getDay() == date2.getDay() &&
			date1.getMonth() == date2.getMonth() &&
			date1.getFullYear() == date2.getFullYear() );
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers


// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		console.log(JSON.stringify(err));
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	console.log(JSON.stringify(err));
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: err
	});
});


module.exports = app;
