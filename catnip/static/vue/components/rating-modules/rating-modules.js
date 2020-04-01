
var RatingModules = {};

RatingModules.EnableButton = {
	props : {
		"module_id" : String,
		"editing" : Boolean,
		"enabled": Boolean,
	},
	data () {
		return {
			"pending" : false,
		};
	},
	methods : {
		update_status : function (enabled) {
			let updated_module = {"module_id" : this.module_id, "enabled" : enabled};
			this.pending = true;
			Service.update(Service.URL_RATING_MODULES, updated_module)
			.then(response => {
				this.$emit("update-enabled-property", enabled);
				Notification.success(" Successfully updated " + this.module_id + ".");
			}).catch(error => {
				Notification.error(error);
			})
			.finally(() => {
				this.pending = false;
			})
		}
	},
	delimiters: ["${","}"],
	template : "#enable-button",
};

RatingModules.Priority = {
	props : {
		"priority" : Number,
		"module_id" : String,
		"hover" : Boolean,
	},
	data () {
		return {
			"editing" : false,
			"pending" : false,
			"updated_priority_value" : this.priority
		};
	},
	methods : {
		update_priority : function () {
			if (this.updated_priority_value == this.priority) {
				this.editing = false;
				return ;
			}
			let updated_module = {
				"module_id" : this.module_id,
				"priority" : this.updated_priority_value
			};
			this.pending = true;
			Service.update(Service.URL_RATING_MODULES, updated_module)
			.then(response => {
				this.$emit("update-priority-property", this.updated_priority_value);
				Notification.success("Successfully updated "  + this.module_id + ".");
			}).
			catch(error => {
				this.updated_priority_value = this.priority;
				Notification.error(error);
			})
			.finally(() => {
				this.pending = false;
				this.editing = false;
			})
		},
		start_editing : function () {
			this.editing = true;
			// Need to promise focus on the input because Vue hasnt update yet
			new Promise(function(resolve, reject) {
			  	setTimeout(function() {
			  		resolve();
			  	}, 10)
			}).then(result => {
				var obj = $("#" + this.module_id);
			  	obj[0].focus();
			});
		}
	},
	delimiters: ["${","}"],
	template : "#priority",
};

RatingModules.Row = {
	template : "#rating-modules-row",
	props : {
		"module" : Object
	},
	delimiters: ["${","}"],
};

RatingModules.RowEdit = {
	template : "#rating-modules-row-edit",
	props : {
		"module" : Object
	},
	data () {
		return {
			"status" : {
				"error" : false,
				"success" : false,
				"hover" : false
			},
		};
	},
	components : {
		"enable-button" : RatingModules.EnableButton,
		"priority" : RatingModules.Priority,
	},
	delimiters: ["${","}"],
};

RatingModules.Table = {
	template : "#rating-modules-table",
	components : {
		"rating-modules-row" : RatingModules.Row,
		"rating-modules-row-edit" : RatingModules.RowEdit
	},
	props : {
		"rating_modules" : Array,
		"is_loading" : Boolean
	},
	computed : {
		get_first_module : function () {
			if (this.rating_modules.length > 0)
				return this.rating_modules[0];
			return {};
		}
	},
	delimiters: ["${","}"],
};

RatingModules.Main = {
	template : "#rating-modules-main",
	components : {
		"rating-modules-table" : RatingModules.Table,
	},
	data () {
		return {
			"rating_modules" : [],
			"url_param" : {},
			"rating_modules_loading" : false,
		};
	},
	methods : {
		_get : function() {
			this.rating_modules_loading = true;
			Service.get(Service.URL_RATING_MODULES,this.url_param)
			.then(response => {
				this.rating_modules = response.modules;
			}).catch(error => {
				this.rating_modules = null;
				Notification.error(error);
			}).finally(() => {
				this.rating_modules_loading = false;
			})
		}
	},
	delimiters: ["${","}"],
	created : function() {
		this._get()
	},
};

export default RatingModules;
