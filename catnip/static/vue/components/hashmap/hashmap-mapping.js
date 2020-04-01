
var HashmapMapping = {};

HashmapMapping.Row = {
	props : {
		"mapping" : Object
	},
	data () {
		return {
			"hover" : false,
		};
	},
	methods : {
		_delete : function() {
			Service.delete(Service.URL_HASHMAP_MAPPING, {mapping_id: this.mapping.mapping_id})
			.then(response => {
				Notification.success("Mapping successfully deleted  ("  + this.mapping.mapping_id + ").");
				this.$emit('delete-mapping', this.mapping.mapping_id);
			}).catch(error => {
				Notification.error(error);
			})
		}
	},
	delimiters: ["${","}"],
	template: "#hashmap-mapping-row"
};

HashmapMapping.RowCreation = {
	props : {
		"service_id" : String, 
		"field_id" : String
	},
	data () {
		return {
			"new_mapping" : {
				"cost" : 0,
				"field_id" : this.field_id,
				"service_id" : this.service_id,
				"tenant_id" : "",
				"group_id" : "",
				"type" : "",
				"value": ""
			},
			"description" : "A mapping is the final object, it’s what triggers calculation."
		};
	},
	methods : {
		_create : function () {
			Service.create(Service.URL_HASHMAP_MAPPING, this.new_mapping)
			.then(response => {
				Notification.success("Mapping successfully created.");
				this.$emit("create-mapping", response);
				this.$emit("close-creation");
			})
			.catch(error => {
				Notification.error(error);
			})
		}
	},
	delimiters: ["${","}"],
	template:"#hashmap-mapping-row-creation"
};

HashmapMapping.Table = {
	props : {
		"service_id" : String,
		"field_id" : String
	},
	data () {
		return {
			"status" : {
				"creating" : false,
				"loading" : false,
				"data_loaded" : false
			},
			"mappings" : []
		};
	},
	methods : {
		_get : function() {
			if (this.status.data_loaded)
				return ;
			this.status.loading = true;
			this.$emit("update-menu-info", {key: "mappping", value: -1});
			let body_params = (this.service_id) ? ({service_id : this.service_id}) : ({field_id : this.field_id});
			Service.get(Service.URL_HASHMAP_MAPPING, body_params)
			.then(response => {
				this.mappings = response.mappings;
				this.status.data_loaded = true;
			}).catch(error => {
				Notification.error(error)
			}).finally(() => {
				this.status.loading = false;
				this.$emit("update-menu-info", {key: "mapping", value: this.mappings.length});
			})
		},
		delete_row : function(mapping_id) {
			for (var idx in this.mappings) {
				if (this.mappings[idx].mapping_id == mapping_id) {
					this.mappings.splice(idx, 1);
					break;
				}
			}
			this.$emit("update-menu-info", {key: "mapping", value: this.mappings.length});
		},
		create_row : function (new_mapping) {
			this.mappings.push(new_mapping);
			this.$emit("update-menu-info", {key: "mapping", value: this.mappings.length});
		},
	},
	components : {
		"hashmap-mapping-row" : HashmapMapping.Row,
		"hashmap-mapping-row-creation" : HashmapMapping.RowCreation,
	},
	delimiters: ["${","}"],
	template: "#hashmap-mapping-table"
};

export default HashmapMapping;