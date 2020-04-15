var Service = {};

/*
** GLOBAL VARIABLES
*/
Service.URL_BASE = "/dashboard/api/"
Service.URL_PROJECT				= Service.URL_BASE + "projects/"
Service.URL_SUMMARY 			= Service.URL_BASE + "summary/";
Service.URL_RATING_MODULES 		= Service.URL_BASE + "rating-modules/";
Service.URL_HASHMAP_SERVICE 	= Service.URL_BASE + "hashmap/service/";
Service.URL_HASHMAP_FIELD 		= Service.URL_BASE + "hashmap/field/"
Service.URL_HASHMAP_MAPPING 	= Service.URL_BASE + "hashmap/mapping/"
Service.URL_HASHMAP_THRESHOLD 	= Service.URL_BASE + "hashmap/threshold/"
Service.URL_HASHMAP_GROUP		= Service.URL_BASE + "hashmap/group/"
Service.URL_SCOPE				= Service.URL_BASE + "scope/"

Service.FETCH_TIMEOUT = 15000;


/*
** REQUEST METHODS
*/
Service.send_request = async function(url, request_properties) {
	return new Promise(function(resolve, reject) {
		let request_timeout = false;
		let timeout_id = setTimeout(() => {
			request_timeout = true;
			reject(new Error("Request timed out"));
		}, Service.FETCH_TIMEOUT)
		let request = new Request(url, request_properties);
		fetch(request).then(response => {
			clearTimeout(timeout_id);
			if (response.status === 200)
				resolve(response);
			else if (!request_timeout)
				response.text().then(response_text => {
					reject(response.status + " " + response_text);
				})
		}).catch(error => {
			if (!request_timeout)
				reject(error);
		})
	});
};

Service.get = async function (url, query_params) {
	return new Promise(function(resolve, reject) {
		let query_string = URLManager.generate_url_query_string(query_params);
		let uri = url + query_string;
		let request_properties = {
			method: "get"
		};
		Service.send_request(uri, request_properties).then(response => {
			Service.redirection_verification(uri, response.url);
			response.json().then(response_json => {
				resolve(response_json);
			});
		}).catch(error_message => {
			reject(error_message);
		})
	});
};

Service.create = async function(url, body_params) {
	return new Promise(function(resolve, reject) {
		let headers = { "X-CSRFToken" : Service.get_cookie("csrftoken") };
		let request_properties = {
			method: "put",
			body: JSON.stringify(body_params),
			headers : headers
		};
		Service.send_request(url, request_properties).then(response => {
			Service.redirection_verification(url, response.url);
			response.json().then(response_json => {
				resolve(response_json);
			});
		}).catch(error_message => {
			reject(error_message);
		})
	});
};

Service.delete = async function(url, body_params) {
	return new Promise(function(resolve, reject) {
		let headers = { "X-CSRFToken" : Service.get_cookie("csrftoken") };
		let request_properties = {
			method: "delete",
			body: JSON.stringify(body_params),
			headers : headers
		};
		Service.send_request(url, request_properties).then(response => {
			Service.redirection_verification(url, response.url);
			response.text().then(response_text => {
				resolve(response_text);
			});
		}).catch(error_message => {
			reject(error_message);
		})
	});
};

Service.update = async function(url, body_params) {
	return new Promise(function(resolve, reject) {
		let headers = { "X-CSRFToken" : Service.get_cookie("csrftoken") };
		let request_properties = {
			method: "post",
			body: JSON.stringify(body_params),
			headers : headers
		};
		Service.send_request(url, request_properties).then(response => {
			Service.redirection_verification(url, response.url);
			response.text().then(response_text => {
				resolve(response_text)
			});
		}).catch(error_message => {
			reject(error_message);
		})
	});
};

/*
** TOOLS
*/

Service.get_cookie = function (name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != "") {
        var cookies = document.cookie.split(";");
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            if (cookie.substring(0, name.length + 1) == (name + "=")) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
};

Service.set_cookie = function(key, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = key + "=" + (value || "")  + expires + "; path=/";
};

Service.redirection_verification = function(request_url, response_url) {
	response_url = decodeURIComponent(response_url);
	let base_url = window.location.protocol + "//" + window.location.hostname;
	base_url += (window.location.port) ? (":" + window.location.port) : "";
	request_url = base_url + request_url;
	// do not redirect if response_url is an API url
	if (request_url != response_url && response_url.includes(Service.URL_BASE)) {
		window.location.replace(response_url);
	}
};
