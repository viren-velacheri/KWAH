//-----------------------------------------------------------------------------
// Class to store saved searches, favorites for each user.
// Author: Viren Velacheri
//-----------------------------------------------------------------------------
var mongojs = require('mongojs');
var _ = require('underscore');

UserDb = function( dbname , collection ) {
    this.db = mongojs( dbname ,[collection],{authMechanism: 'ScramSHA1'});
    this.collection = this.db.collection( collection );
};

UserDb.prototype.getSearch = function( username,callback ) {
    this.collection.find( {'name':username },{'_id':0,'search':1} , function(error,result) {
	if (error) 
	    callback(error,null);
	else
	    callback(null,result);
    });
};

UserDb.prototype.getMyList = function( username,callback ) {
    this.collection.find( {'name':username },{'_id':0,'yes':1} , function(error,result) {
	if (error) 
	    callback(error,null);
	else
	    callback(null,result);
    });
};

UserDb.prototype.save = function( record,callback ) {
    this.collection.save( record , function(error) {
	if (error) 
	    callback(error);
	else
	    callback(null);
    });
};

UserDb.prototype.find = function( query,callback ) {
    this.collection.find(query , function(error,result) {
	if (error) 
	    callback(error,null);
	else
	    callback(null,result);
    });
};

UserDb.prototype.saveSearch = function( username, search_string, search_query, callback ) {
    this.collection.update( {'name':username } , {'$addToSet':{'search': search_string,'query':search_query}} , function(error) {
	if (error) 
	    callback(error);
	else
	    callback(null);
    });
};

UserDb.prototype.deleteSearch = function( username, search_string, search_query,callback ) {
    console.log("UserDb.deleteSearch::username = " + username);
    console.log("UserDb.deleteSearch::search_string = " + search_string);
    console.log("UserDb.deleteSearch::search_query = " + search_query);
    this.collection.update( {'name':username } , {'$pull':{'search': search_string,'query':search_query}} , function(error) {
	if (error) 
	    callback(error);
	else
	    callback(null);
    });
};

UserDb.prototype.deleteUser = function( username,callback ) {
    console.log("UserDb.deleteUser::username = " + username);
    this.collection.remove( {'name':username }, function(error) {
	if (error) 
	    callback(error);
	else
	    callback(null);
    });
};

UserDb.prototype.getPref = function( username, callback ) {
    this.collection.find( {'name':username } , {'_id':0,'yes':1,'no':1}, function(error,result) {
	if (error) 
	    callback(error,null);
	else { 
	    callback(null,result);
	}
    });
};

UserDb.prototype.savePref = function( username,pref,id,remove,callback ) {

    var updset = {} ;

    if (remove) {
    	if ( pref == 'yes' ) updset = { '$pull':{'yes':id} };
    	if ( pref == 'no' )  updset = { '$pull':{'no':id} };
    }
    else {
    	if ( pref == 'yes' ) updset = { '$addToSet':{'yes':id},'$pull':{'no':id} };
    	if ( pref == 'no' )  updset = { '$addToSet':{'no' :id},'$pull':{'yes':id} };
    }

    this.collection.update( {'name':username } , updset , function(error) {
	if (error) 
	    callback(error);
	else
	    callback(null);
    });
};

module.exports = UserDb ;
