//-----------------------------------------------------------------------
//Node js script to update pet db and email notify users of new additions
//to db
//Invoke in a cron job using: node update_and_notify.js
//Author: Viren Velacheri
//-----------------------------------------------------------------------

//--------------- Modules -------------------
var _ = require('underscore');
var wait = require('wait.for');
var moment = require("moment");
var util = require('./kwah-util.js') ;
var searchStringToMongoQuery = require('./searchStringToMongoQuery.js');
//-------------------------------------------



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

//------------------------------------ --

//Using wait.for all async functions are called in a sequential manner
//avoiding the pyramid of doom or callback hell
function sequentialMain() {
  console.log('fiber start');

  var rval ;
  var db = wait.for(util.dbOpen,connection);

  var usercollection  = db.collection('users');
  var petcollection   = db.collection('pets');
  var crawlcollection = db.collection('crawl');

  //Set of all pet ids
  var pet_ids;

  //Set of all crawled ids
  var crawl_ids;

  //IDs of all pets that are in both sets
  var intersect_ids;

  //IDs of pets to be removed from pet db
  var remove_pet_ids;

  //IDs of pets to be added to pet db
  var add_pet_ids ;

  var petresults ;

  var crawlresults;

  petresults = wait.for(util.dbFind,petcollection,{});
  //console.log('petresults = ' + JSON.stringify(petresults));

  crawlresults = wait.for(util.dbFind,crawlcollection,{});

  //console.log('crawlresults = ' + JSON.stringify(crawlresults));
  crawlresults.forEach( function(elem) {
    rval = wait.for(util.dbUpdate,crawlcollection,{_id:elem['_id']},{'$set':{date: new Date(elem['date_string'])} });
  });

  //Set of all pet ids
  pet_ids = util.getSetByField(petresults,'id');

  //Set of all crawled ids
  crawl_ids = util.getSetByField(crawlresults,'id');

  //IDs of all pets that are in both sets
  intersect_ids = util.getIntersection(pet_ids,crawl_ids);

  //IDs of pets to be removed from pet db
  remove_pet_ids = util.getNotInTargetSet(pet_ids,intersect_ids);

  //IDs of pets to be added to pet db
  add_pet_ids = util.getNotInTargetSet(crawl_ids,intersect_ids);

  console.log('remove_pet_ids = ' + JSON.stringify(remove_pet_ids));
  console.log('add_pet_ids = ' + JSON.stringify(add_pet_ids));

  //Add new pets
  add_pet_ids.forEach( function(elem) {
    var recs = wait.for(util.dbFind,crawlcollection,{id:elem});
    rval= wait.for(util.dbSave,petcollection,recs[0]);
    if (rval)
    console.log("SUCCESS:added new rec with id = " + recs[0]['id']);
    else
    console.log("FAIL:add of new rec with id = " + recs[0]['id']);
  });

  //Update
  remove_pet_ids.forEach( function(elem) {
    rval = wait.for(util.dbUpdate,petcollection,{id:elem},{'$set':{adopted:'true', id:'-'}});
    if (rval)
    console.log("SUCCESS:updated rec with id = " + elem);
    else
    console.log("FAIL:update rec with id = " + elem);
  });

  var userresults = wait.for(util.dbFind,usercollection,{});
  console.log(JSON.stringify(userresults));

  userresults.forEach( function(user) {
    console.log(JSON.stringify(user['name']));

    user['search'].forEach( function(search,idx) {

      var query = searchStringToMongoQuery(search);

      var results = wait.for(util.dbFind,crawlcollection,query);

      var count = 0;
      results.forEach( function(result) {
        if ( _.contains( add_pet_ids,result['id'] ) )
        count++;
      });

      //console.log(results.length);
      if ( count > 0 ) {
        var data = {
          from: 'postmaster@sandbox4b933ab0e05f44c6acc33fbe4890134b.mailgun.org',
          to: user['email'],
        };
        //var search = user['search'][idx];
        data['subject'] = "KokoWantsAHome: New matches for search :" + search + ":count = " + count;
        data['text'] = data['subject'] + "\nFollow link: " + "http://" + web_host + "/browse/?filter=1&search=" + encodeURI(search);
        console.log(JSON.stringify(data));
        rval = wait.for(util.sendEmail,data);
        if (rval) console.log( "Success: Email with subject = " + data['subject']);
      }
    });
  });

  //Clear out temporary crawl dB
  var rval = wait.for(util.dbRemove,crawlcollection,{});

  db.close();
};

console.log('app start');

wait.launchFiber(sequentialMain);

console.log('after launch');
