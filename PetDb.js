//-------------------------------------------------------------------------
// Class for procedural access to the Pet database
// Author: Viren Velacheri
//-------------------------------------------------------------------------
var mongojs = require('mongojs');
var _ = require('underscore');

PetDb = function( dbname , collection ) {
    this.db = mongojs( dbname ,[collection], {authMechanism: 'ScramSHA1'});
    this.collection = this.db.collection( collection );
};

PetDb.prototype.getByGender = function( gender, callback ) {

    this.collection.find( {'gender':gender} , {} , function(error, docs) {
	if (error) callback(error,null);
	else {
	    if ( docs.length == 0 )
			callback(new Error("getByGender("+gender+") not found"), null);
	    else
			callback(null,docs);
		}
    });
};

PetDb.prototype.getBySearch = function( search, callback ) {

    this.collection.find( search ).sort({date:-1} , function(error, docs) {
	if (error) callback(error,null);
	else {
	    if ( docs.length == 0 )
			callback(new Error("getBySearch("+JSON.stringify(search)+") not found"), null);
	    else {
		callback(null,docs);
	    }
	}
    });
};

module.exports = PetDb ;
