//-----------------------------------------------------------------------
//Node js script to prune (remove) adopted pets from the database that
//are more older than DAYS_BEFORE
//Author:Viren Velacheri
//-----------------------------------------------------------------------

//--------------- Modules -------------------
var wait = require('wait.for');
var moment = require("moment");
var fs = require('fs');
var util = require('./kwah-util.js') ;
//-------------------------------------------

//How many days before to prune database
var DAYS_BEFORE = 7 ;

// Connection URL
// connect now, and worry about collections later
var connection;
if (process.env.MONGOLAB_URI)
connection = "mongodb://" + process.env.MONGOLAB_URI ;
//if (process.env.MONGOHQ_URL)
//  connection = "mongodb://" + process.env.MONGOHQ_URL ;
else
connection = "mongodb://localhost:27017/scrapy" ;

console.log("connection = " + connection);
var web_host = process.env.WEB_HOST || 'localhost:3000' ;

//-- Compute date before which to trim --
var today = new Date();
today = Date.now();
var mday = moment(today);

console.log("today = " + mday.toString());

var trimdate = mday.subtract(DAYS_BEFORE,'d');

var day = trimdate.toDate();

console.log('trimdate =' + day);
//------------------------------------ --

//Using wait.for all async functions are called in a sequential manner
//avoiding the pyramid of doom or callback hell
function sequentialMain() {
  console.log('fiber start');

  var rval ;
  var db = wait.for(util.dbOpen,connection);

  var petcollection   = db.collection('pets');

  //Set of all pet ids
  var pet_ids;

  var petresults ;

  //------------ Prune database section, clear out db entries more than N days old,
  // set by DAYS_BEFORE variable at top of file

  //Query to pick up all pets that have been adopted and with a date less than day

  var datequery = { '$and': [ {'date':{ '$lt':day }}, {'adopted':'true'}]} ;

  petresults = wait.for(util.dbFind,petcollection,datequery);

  //Set of pet ids matching datequery
  pet_ids = util.getSetByField(petresults,'id');
  console.log( 'prune::pet_ids = ' + JSON.stringify(pet_ids) );

  //Get list of images to be removed
  var adopted_images = util.getSetByField(petresults,'images');

  //Remove records from database
  rval = wait.for(util.dbRemove,petcollection,datequery);

  //Now delete image files
  adopted_images.forEach( function(elem) {
    var image_path = elem[0]['path'].split('/');
    var image_filename = image_path[image_path.length-1];
    var image_git_path = "public/images/thumbs/big/" + image_filename;
    rval = wait.for(util.rmFile,fs,image_git_path) ;
    if ( rval )
    console.log("deleted " +  image_git_path);
  });
  
  //---------------- End prune section ----------------

  db.close();
};

console.log('prune app start');

wait.launchFiber(sequentialMain);

console.log('after launch');
