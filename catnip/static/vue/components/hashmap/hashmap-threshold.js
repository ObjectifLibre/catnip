var HashmapThreshold = {};

HashmapThreshold.Row = {
	props : {
		"threshold" : Object
	},
	data () {
		return {
			"hover" : false
		};
	},
	methods : {
		_delete : function () {
			Service.delete(Service.URL_HASHMAP_THRESHOLD, {threshold_id: this.threshold.threshold_id})
			.then(response => {
				Notification.success("Threshold successfully deleted  (" + this.threshold.threshold_id + ").");
				this.$emit("delete-threshold", this.threshold.threshold_id);
			}).catch(error => {
				Notification.error(error);
			})
		}
	},
	delimiters: ["${","}"],
	template: "#hashmap-threshold-row"
};

HashmapThreshold.RowCreation = {
	props : {
		"service_id" : String, 
		"field_id" : String
	},
	data () {
		return {
			"new_threshold" : {
				"level": 0,
				"cost": 0,
				"field_id": this.field_id,
				"service_id": this.service_id,
				"tenant_id": "",
				"group_id": "",
				"type": "",
			},
			"description" : "A threshold entry is used to apply rating rules base on level. Its behaviour is similar to a mapping except that it applies the cost base on the level."
		};
	},
	methods : {
		_create : function () {
			Service.create(Service.URL_HASHMAP_THRESHOLD, this.new_threshold)
			.then(response => {
				Notification.success("Threshold successfully created.");
				this.$emit("create-threshold", response);
				this.$emit("close-creation");
			})
			.catch(error => {
				Notification.error(error);
			})
		}
	},
	delimiters: ["${","}"],
	template:"#hashmap-threshold-row-creation"
};

HashmapThreshold.Table = {
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
			"thresholds": []
		};
	},
	methods : {
		_get : function() {
			if (this.status.data_loaded)
				return ;
			this.status.loading = true;
			this.$emit("update-menu-info", {key: "threshold", value: -1});
			let body_params = (this.service_id) ? ({service_id : this.service_id}) : ({field_id : this.field_id});
			Service.get(Service.URL_HASHMAP_THRESHOLD, body_params)
			.then(response => {
				this.thresholds = response.thresholds;
				this.status.data_loaded = true;
			}).catch(error => {
				Notification.error(error)
			}).finally(() => {
				this.status.loading = false;
				this.$emit("update-menu-info", {key: "threshold", value: this.thresholds.length});
			})
		},
		delete_row : function(threshold_id) {
			for (var idx in this.thresholds) {
				if (this.thresholds[idx].threshold_id == threshold_id) {
					this.thresholds.splice(idx, 1);
					break;
				}
			}
			this.$emit("update-menu-info", {key: "threshold", value: this.thresholds.length});
		},
		create_row : function (new_threshold) {
			this.thresholds.push(new_threshold);
			this.$emit("update-menu-info", {key: "threshold", value: this.thresholds.length});
		},
	},
	components : {
		"hashmap-threshold-row" : HashmapThreshold.Row,
		"hashmap-threshold-row-creation" : HashmapThreshold.RowCreation
	},
	delimiters: ["${","}"],
	template: "#hashmap-threshold-table"
};

export default HashmapThreshold;
