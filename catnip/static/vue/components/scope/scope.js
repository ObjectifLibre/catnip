import Filter from "../filter/filter.js";

var Scope = {};

Scope.Row = {
	props : {
		"scope" : Object
	},
	methods : {
		format_data : function(data) {
			return FormatData.format_data(data);
		}
	},
	delimiters: ["${","}"],
	template:"#scope-table-row",
};

Scope.Table = {
	props : {
		"is_loading" : Boolean,
		"scopes" : Array
	},
	computed : {
		scopes_header : function  () {
			let scopes_header_list = [];
			if (this.scopes != undefined && this.scopes.length > 0)
				scopes_header_list = Object.keys(this.scopes[0]);
			return scopes_header_list;
		}
	},
	components: {
		"scope-table-row" : Scope.Row
	},
	delimiters : ["${", "}"],
	template:"#scope-table",
};

Scope.Main = {
	props: {
		"api_version": Number
	},
	data () {
		return {
			"scopes": [],
			"url_params" : {
				"collector" : [],
				"fetcher" : [],
				"limit": 10,
				"offset" : 0,
				"scope_id" : [],
				"scope_key" : []
			},
			"scope_loading" : false,
		};
	},
	methods : {
		update_scope : function (filter_param) {
			this.url_params[filter_param.key] = filter_param.value;
			URLManager.apply_filter_to_url(this.url_params, this.$router);
			this._get();
		},
		_get : function () {
			this.scope_loading = true;
			Service.get(Service.URL_SCOPE, this.url_params).then(response => {
				this.scopes = response.results;
			}).catch(error => {
				this.scopes = null;
				Notification.error(error);
			}).finally(() => {
				this.scope_loading = false;
			})
		},
	},
	created : function () {
		URLManager.parse_query_params(this.url_params, this.$route.query);
		this._get();
	},
	components: {
		"scope-table" : Scope.Table,
		"filter-array" : Filter.Array
	},
	delimiters : ["${", "}"],
	template:"#scope-main",
};

export default Scope;
