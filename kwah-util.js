//------------------------------------------------------
// Common utility functions
// Note: Using mongodb driver as opposed to mongojs
//       because of bug in mongojs driver in closing
//       database.
// Author: Viren Velacheri
//------------------------------------------------------

var MongoClient = require('mongodb').MongoClient;

var api_key = 'YOUR_MAILGUN_API_KEY';
var domain = 'YOUR_MAILGUN_DOMAIN';

var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

var isContainedIn = function(elem,set) {
  for(var i=0;i<set.length;i++)
  if (set[i] == elem)
  return true ;
  return false ;
};

module.exports = {
  //------------ Functions ----------------------
  getNotInTargetSet : function(set,targetset) {
    var collection=[];
    for(var i=0;i<set.length;i++) {
      if ( !(isContainedIn(set[i],targetset)) )
      collection.push(set[i]);
    }
    return collection;
  },

  getIntersection : function(set1,set2) {
    var collection=[];
    for(var i=0;i<set1.length;i++) {
      if ( isContainedIn(set1[i],set2) )
      collection.push(set1[i]);
    }
    return collection;
  },

  getSetByField : function(set,field) {
    var collection = [];
    for(var i=0;i<set.length;i++)
    collection.push(set[i][field]);
    return collection;
  },

  isContainedIn : function(elem,set) {
    for(var i=0;i<set.length;i++)
    if (set[i] == elem)
    return true ;
    return false ;
  },

  dbOpen : function(connection, cbk) {
    // Use connect method to connect to the Server
    MongoClient.connect(connection, function(err, db) {
      if (err)
      cbk(err,null);
      else {
        console.log("Connected correctly to server");
        cbk(null,db);
      }
    });
  },

  dbFind : function(collection,query,cbk) {
    collection.find(query).toArray(function(err,results) {
      if (err) {
        console.log(JSON.stringify(err));
        cbk(err,null);
      }
      else
      cbk(null,results);
    });
  },

  dbSave : function(collection,rec,cbk ) {
    collection.insertOne(rec, function(err) {
      if (err) {
        console.log(JSON.stringify(err));
        cbk(err,false);
      }
      else
      cbk(null,true);
    });
  },

  dbUpdate : function(collection,query,update,cbk ) {
    collection.updateOne(query, update, function(err) {
      if (err) {
        console.log(JSON.stringify(err));
        cbk(err,false);
      }
      else
      cbk(null,true);
    });
  },

  dbRemove : function(collection,query,cbk ) {
    collection.deleteMany(query, function(err) {
      if (err) {
        console.log(JSON.stringify(err));
        cbk(err,false);
      }
      else
      cbk(null,true);
    });
  },

  sendEmail: function(data,cbk) {
    mailgun.messages().send(data, function (err, body) {
      if (err) {
        console.log(JSON.stringify(err));
        cbk(err,false);
      }
      else {
        console.log(body);
        cbk(null,true);
      }
    });
  },

  dbClose: function(db,cbk) {
    db.close( function(err) {
      if (err) cbk(err,false);
      else cbk(null,true);
    });
  },

  rmFile : function(fs,imgfile,cbk) {
    fs.unlink(imgfile, function(err) {
      if (err) cbk(null,false);
      else cbk(null,true);
    });
  }
} ;
