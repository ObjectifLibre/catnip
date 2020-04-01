var URLManager = {};

// adding a filter function to Object class
Object.filter = (obj, predicate) => 
    Object.keys(obj)
          .filter( key => predicate(obj[key]) )
          .reduce( (res, key) => (res[key] = obj[key], res), {} );


URLManager.apply_filter_to_url = function(url_params, $router, route_name) {
	// url_params contains params that will be in url
	// to put correctly objects in url and avoid [Object], we need to stringtify them. 
	let query_params = URLManager.stringify_query_params(url_params);
	$router.replace({ name: route_name, query: query_params});
};

// stringify some attribute values to properly deal with object type
URLManager.stringify_query_params = function(query_params) {
	let query_params_str = {};
	for (let key in query_params) {
		if (query_params[key] instanceof Object && !(query_params[key] instanceof Array))
			query_params_str[key] = JSON.stringify(query_params[key]);
		else
			query_params_str[key] = query_params[key];
	}
	return query_params_str;
};

// Creates a query string that contains all fields of query_params
URLManager.generate_url_query_string = function(query_params) {
	if (query_params)
		return "?" + Object.keys(query_params).map(key => 
			key + "=" + ((query_params[key] instanceof Object && !(query_params[key] instanceof Array)) ? 
				(JSON.stringify(Object.filter(query_params[key], (value) => value && value.length > 0))) : (query_params[key]))
		).join("&");
	return "";
};

// Inventory all fields name which have values as array
var ARRAY_FIELD_NAMES = ["groupby", "fetcher", "collector", "scope_id", "scope_key"];
// Inventory all fields name which have values as object
var OBJECT_FIELD_NAMES = ["filters"];

// Parse query params to transform string values in object or array
URLManager.parse_query_params = function (url_params, query_params) {
	for (let key in query_params) {
		if (query_params[key] != undefined &&
			query_params[key] != null) {
			if (ARRAY_FIELD_NAMES.includes(key)) {
				// Check if the value is not already an array
				if (!(query_params[key] instanceof Array))
					query_params[key] = query_params[key].split(",");
				// Delete empty indexes
				query_params[key] = query_params[key].filter(groupby => groupby.length > 0);
			}
			else if (OBJECT_FIELD_NAMES.includes(key)) {
				// Check if the value is not already an object
				if (typeof query_params[key] === "string")
					query_params[key] = JSON.parse(query_params[key]);
				query_params[key] = Object.filter(query_params[key], value => value && value.length > 0);
			}
			url_params[key] = query_params[key];
		}
	}
};