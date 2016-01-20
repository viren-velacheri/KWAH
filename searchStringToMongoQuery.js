//----------------------------------------------------------------------------
//Takes a search string and turns it into a mongo query object
//with an $and operation between each string
//Example queries:
//1. poodle : search for all records that have poodle in any field
//2. poodle male : records must have poodle AND male
//3. poodle male 3 : poodle AND male AND age LESS than or EQUAL to 3 years
//4. poodle male 3 years : same as (3) above
//5. poodle male 3 yrs : same as (3) above
//6. poodle male < 3 year : same as (3) above
//7. poodle male > 3 : poodle AND male AND age GREATER than or EQUAL to 3 years
//Author: Viren Velacheri
//----------------------------------------------------------------------------
var searchStringToMongoQuery = function( search_string ) {

	var isNumber = function( value ) {
		//To account for the fact that
		//isNaN(' ') will return false, ' ' --> treated as 0
		//by isNaN, however parseInt(' ') --> NaN
		return !isNaN(parseInt(value)) ;
	};

	var YEAREXPR = ['year','yr','years','yrs'];

	var PUPEXPR = ['pup','puppy','puppie','puppies','puppys'];

	var query = {};

	var terms = search_string.trim().split(' ');

	var q_list = [] ;

	var regex_expr ;

	var age ;

	//by default if just a number, assume less than '<'
	var age_compare = '<' ;

	for(var idx=0;idx<terms.length;idx++) {
		var q = {} ;

		//Pick up any number and assume it
		//is age
		if (isNumber(terms[idx])) {
			age = parseInt(terms[idx]);
			continue;
		}

		//Squash terms such as 'year','yr','years','yrs'
		//indexOf returns the index of the array that is matched
		//if nothing found it returns -1, so any value other than
		//-1 indicates that it was found in the array
		if ( YEAREXPR.indexOf( terms[idx].toLowerCase() ) != -1 ) {
			continue;
		}

		//Specifying pup, puppy implies age = 0
		if ( PUPEXPR.indexOf( terms[idx].toLowerCase() ) != -1 ) {
			age = 0;
			continue;
		}

		//Squash terms such as 'year','yr','years','yrs'
		//indexOf returns the index of the array that is matched
		//if nothing found it returns -1, so any value other than
		//-1 indicates that it was found in the array
		if ( YEAREXPR.indexOf( terms[idx].toLowerCase() ) != -1 ) {
			continue;
		}

		//greater than
		if ( terms[idx] == '>') {
			age_compare = '>' ;
			continue;
		}

		//less than
		if ( terms[idx] == '<') {
			age_compare = '<' ;
			continue;
		}

		//equal
		if ( terms[idx] == '=') {
			age_compare = '=' ;
			continue;
		}

		if (terms[idx].toLowerCase() == "male")
			regex_expr = "^" + terms[idx]  ;
		else
			regex_expr = terms[idx]  ;
		q['search_text'] = { '$regex': regex_expr , '$options':'i' };
		q_list.push(q);
	}

	var age_query ;
	if (age != undefined) {
		switch(age_compare) {
			case '<' :
			age_query = { 'age' : { '$lte' : age}} ;
			break ;
			case '>' :
			age_query = { 'age' : { '$gte' : age}} ;
			break ;
			case '=' :
			age_query = { 'age' :  age} ;
			break ;
			default :
			age_query = { 'age' : { '$lte' : age}} ;
		}

		q_list.push(age_query);
	}

	query['$and'] = q_list;

	return query ;
};

module.exports = searchStringToMongoQuery ;
