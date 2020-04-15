import { EventBus } from "../event-bus/event-bus.js";
import Filter from "../filter/filter.js";

var Summary = {};

Summary.PAGINATION_LIMIT = 20;

Summary.Body = {
	props : {
		"value_list" : Array
	},
	delimiters: ["${","}"],
	data () {
		return {
			"value" : null,
		};
	},
	methods : {
		format_data : function(data) {
			return FormatData.format_data(data);
		}
	},
	template:"#summary-body-table"
};

Summary.Head = {
	props : {
		"name_list" : Array
	},
	data () {
		return {
			"name" : null
		};
	},
	delimiters: ["${","}"],
	template: "#summary-head-table"
};

Summary.Table = {
	props: {
		"is_loading" : Boolean,
		"summary": Object,
		"current_page" : Number,
		"limit" : Number
	},
	components: {
		"summary-head-table" : Summary.Head,
		"summary-body-table" : Summary.Body,
	},
	methods: {
		go_to_page : function (page_number) {
			this.$emit("update-filter", {key: "page", value: page_number});
		},
		get_row_key: function() {
			// summary row fields haven"t id. To fix that we generate an unique identifier
			return get_random_uuid();
		}
	},
	computed: {
		pagination_length () {
			if (this.summary.total % this.limit)
				// if the division"s rest is positive, the number of page is increased by one
				return (this.summary.total / this.limit >> 0) + 1;
			return (this.summary.total / this.limit >> 0);
		},
	},
	delimiters: ["${","}"],
	template:"#summary-table",
};

Summary.Main = {
	props: {
		"api_version": Number
	},
	components: {
		"summary-table" : Summary.Table,
		"filter-object" : Filter.Object,
		"filter-array" : Filter.Array,
		"filter-date" : Filter.Date
	},
	data () {
		return {
			"set_up": false,
			"summary_results": {},
			"url_params" : {
				"limit" : Summary.PAGINATION_LIMIT,
				"page" : 1,
				"groupby": [],
				"filters": {},
				"end" : "",
				"begin" : ""
			},
			"summary_loading" : false,
		};
	},
	methods : {
		update_summary : function (filter_param) {
			// if filters change we need to return to page 1
			if (filter_param.key != "page")
				this.url_params["page"] = 1;
			this.url_params[filter_param.key] = filter_param.value;
			URLManager.apply_filter_to_url(this.url_params, this.$router);
			this._get();
		},
		_get : function () {
			this.summary_loading = true;
			this.url_params["chart"] = false;
			Service.get(Service.URL_SUMMARY, this.url_params)
			.then(response => {
				this.summary_results = response;
			}).catch(error => {
				Notification.error(error)
				this.summary_results = null;
			}).finally(() => {
				this.summary_loading = false;
			})
		}
	},
	created : function () {
		// listen the project switching
		EventBus.$on("switching-project", (project_id) => {
			if (project_id != this.url_params["filters"]["project_id"]) {
				Vue.set(this.url_params["filters"], "project_id", project_id);
				this._get();
	  		}
		});

		URLManager.parse_query_params(this.url_params, this.$route.query);
		// if there is no project_id filter in url_params, we set it to null to get ALL projects
		if (this.url_params["filters"]["project_id"] === undefined)
			Vue.set(this.url_params["filters"], "project_id", null);
		this._get();
	},
	delimiters: ["${","}"],
	template:"#summary-main",
};

export default Summary;
