import HashmapMapping from "./hashmap-mapping.js";
import HashmapThreshold from "./hashmap-threshold.js";

var HashmapField = {};

HashmapField.Card = {
	props : {
		"field_id" : String
	},
	data () {
		return {
			"current_view" : "mapping",
			// menu_info contains the qty of items per module, if -1, client is fetching module data.
			"menu_info" : {
				"mapping" : -1,
				"threshold" : -1,
			}
		};
	},
	methods : {
		get_field_data : function () {
			this.$refs[this.field_id + "mapping"]._get();
			this.$refs[this.field_id + "threshold"]._get();
		},
		update_menu_info : function (info) {
			this.menu_info[info.key] = info.value;
		}
	},
	components : {
		"hashmap-mapping-table" : HashmapMapping.Table,
		"hashmap-threshold-table" : HashmapThreshold.Table,
	},
	delimiters: ["${","}"],
	template:"#hashmap-field-card"
};

HashmapField.Row = {
	props : {
		"field" : Object
	},
	data () {
		return {
			"is_open" : false,
			"chevron" : 'chevron-right',
			"row_class" : '',
			"hover" : false
		};
	},
	methods : {
		open_row : function () {
			this.is_open = !this.is_open;
			(this.is_open) ? (this.chevron = "chevron-down") : (this.chevron = "chevron-right");
			(this.is_open) ? (this.row_class = "background-gradient") : (this.row_class = "");
			this.$emit("open-field", this.field.field_id);
		},
		_delete: function () {
			Service.delete(Service.URL_HASHMAP_FIELD, {field_id : this.field.field_id})
			.then(response => {
				Notification.success("Field successfully deleted  (" + this.field.field_id + ").");
				this.$emit("delete-field", this.field.field_id);
			}).catch(error => {
				Notification.error(error);
			})
		}
	},
	delimiters: ["${","}"],
	template:"#hashmap-field-row"
};

HashmapField.RowCreation = {
	props : {
		"service_id" : String
	},
	data () {
		return {
			"new_field" : {
				"name" : "",
				"service_id" : this.service_id
			},
			"description" : "A field is referring to a metadata field of a resource."
		};
	},
	methods : {
		_create : function() {
			Service.create(Service.URL_HASHMAP_FIELD, this.new_field)
			.then(response => {
				Notification.success("Field successfully created.");
				this.$emit("create-field", response);
				this.$emit("close-creation");
			})
			.catch(error => {
				Notification.error(error);
			})
		},
	},
	delimiters: ["${","}"],
	template:"#hashmap-field-row-creation"
};

HashmapField.Table = {
	props : {
		"service_id" : String,
	},
	data () {
		return {
			"status" : {
				"creating" : false,
				"loading" : false,
				"data_loaded" : false
			},
			"fields" : []
		};
	},
	methods : {
		_get : function() {
			if (this.status.data_loaded)
				return ;
			this.status.loading = true;
			this.$emit("update-menu-info", {key: "field", value: -1});
			Service.get(Service.URL_HASHMAP_FIELD, {service_id : this.service_id})
			.then(response => {
				this.fields = response.fields;
				this.status.data_loaded = true;
			}).catch(error => {
				Notification.error(error);
			}).finally(() => {
				this.status.loading = false;
				this.$emit("update-menu-info", {key: "field", value: this.fields.length});
			})
		},
		delete_row : function(field_id) {
			for (var idx in this.fields) {
				if (this.fields[idx].field_id == field_id) {
					this.fields.splice(idx, 1);
					break;
				}
			}
			this.$emit("update-menu-info", {key: "field", value: this.fields.length});
		},
		create_row: function (new_field) {
			this.fields.push(new_field);
			this.$emit("update-menu-info", {key: "field", value: this.fields.length});
		},
		open_field : function(field_id) {
			this.$refs[field_id][0].get_field_data();
		},
	},
	components : {
		"hashmap-field-card" : HashmapField.Card,
		"hashmap-field-row" : HashmapField.Row,
		"hashmap-field-row-creation" : HashmapField.RowCreation 
	},
	delimiters: ["${","}"],
	template: "#hashmap-field-table"
};

export default HashmapField;
