import HashmapField from "./hashmap-field.js";
import HashmapMapping from "./hashmap-mapping.js";
import HashmapThreshold from "./hashmap-threshold.js";

var HashmapService = {};

HashmapService.Card = {
	props : {
		"service_id" : String
	},
	data () {
		return {
			"current_view" : "field",
			// menu_info contains the qty of items per module, if -1, client is fetching module data.
			"menu_info" : {
				"field" : -1,
				"mapping" : -1,
				"threshold" : -1,
			},
		};
	},
	methods : {
		get_service_data : function () {
			this.$refs[this.service_id + "field"]._get();
			this.$refs[this.service_id + "mapping"]._get();
			this.$refs[this.service_id + "threshold"]._get();
		},
		update_menu_info : function (info) {
			this.menu_info[info.key] = info.value;
		}
	},
	components : {
		"hashmap-field-table" : HashmapField.Table,
		"hashmap-mapping-table" : HashmapMapping.Table,
		"hashmap-threshold-table" : HashmapThreshold.Table,
	},
	delimiters: ["${","}"],
	template:"#hashmap-service-card"
};

HashmapService.Row = {
	props : {
		"service" : Object
	},
	data () {
		return {
			"is_open" : false,
			"chevron" : "chevron-right",
			"row_class" : "",
			"hover": false,
		};
	},
	methods : {
		open_row : function () {
			this.is_open = !this.is_open;
			(this.is_open) ? (this.chevron = "chevron-down") : (this.chevron = "chevron-right");
			(this.is_open) ? (this.row_class = "background-gradient") : (this.row_class = "");
			this.$emit("open-service", this.service.service_id);
		},
		_delete : function() {
			Service.delete(Service.URL_HASHMAP_SERVICE, {service_id : this.service.service_id})
			.then(response => {
				Notification.success("Service successfully deleted (" + this.service.service_id + ").");
				this.$emit("delete-service", this.service.service_id);
			}).
			catch(error => {
				Notification.error(error);
			})
		}
	},
	delimiters: ["${","}"],
	template:"#hashmap-service-row"
};

HashmapService.RowCreation = {
	data () {
		return {
			"new_service" : {
				"name" : ""
			},
			"description" : "A service is a way to map the rule to the type of data collected."
		};
	},
	methods : {
		_create : function() {
			Service.create(Service.URL_HASHMAP_SERVICE, this.new_service)
			.then(response => {
				Notification.success("Service successfully created.");
				this.$emit("create-service", response);
				this.$emit("close-creation");
			})
			.catch(error => {
				Notification.error(error);
			})
		},
		cancel : function () {
			this.$emit("close-creation");
		}
	},
	delimiters: ["${","}"],
	template:"#hashmap-service-row-creation"
};

HashmapService.Table = {
	components : {
		"hashmap-service-card" : HashmapService.Card,
		"hashmap-service-row" : HashmapService.Row,
		"hashmap-service-row-creation" : HashmapService.RowCreation
	},
	data () {
		return {
			"status" : {
				"creating" : false,
				"loading" : false,
				"data_loaded" : false
			},
			"services" : []
		};
	},
	created : function() {
		this._get();
	},
	methods : {
		_get: function() {
			if (this.status.data_loaded)
				return ;
			this.status.loading = true;
			this.$emit("update-menu-info", {key: "service", value: -1});
			Service.get(Service.URL_HASHMAP_SERVICE)
			.then (response =>{
				this.services = response.services;
				this.status.data_loaded = true;
			})
			.catch (error => {
				this.services = [];
				Notification.error(error);
			})
			.finally(() => {
				this.status.loading = false;
				this.$emit("update-menu-info", {key: "service", value: this.services.length});
			})
		},
		delete_row: function(service_id) {
			for (var idx in this.services) {
				if (this.services[idx].service_id == service_id) {
					this.services.splice(idx, 1);
					break;
				}
			}
			this.$emit("update-menu-info", {key: "service", value: this.services.length});
		},
		create_row: function(new_service) {
			this.services.push(new_service);
			this.$emit("update-menu-info", {key: "service", value: this.services.length});
		},
		open_service : function(service_id) {
			this.$refs[service_id][0].get_service_data();
		},
	},
	delimiters: ["${","}"],
	template:"#hashmap-service-table"
};

export default HashmapService;
