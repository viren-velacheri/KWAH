//Update Kennel meta dat for each dog in database
var recs = db.pets.find({}).toArray();

var total_recs = 0;
var upd_recs = 0 ;

recs.forEach( function(rec) {
	total_recs++;
	var mdata_list = db.meta.find( {'id' : rec['id']} ).toArray();
	if ( mdata_list.length != 0 ) {
		//print("Found id: " + rec['id']);
		upd_recs++;
		var mdata = mdata_list[0];

		db.pets.update({'id' : rec['id']},{'$set' : {
				'kennel' : mdata['kennel'],
				'size' : mdata['size']
			} ,
			'$addToSet' : { 'search_text' : { '$each': [ mdata['size'] , mdata['kennel'] ]} }
		});
	}
	//else
		//print("Unable to find metadata for id:" + rec['id'])

});
var notupd_recs = total_recs - upd_recs;
print("ID UPDATE: Updated " + upd_recs    + " records");
print("ID UPDATE: Skipped " + notupd_recs + " records");
