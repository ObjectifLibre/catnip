var Filter = {};

Filter.Array = {
	props : {
		"name" : String,
		"filters" : Array,
	},
	data () {
		return {
			"id": null
		};
	},
	methods : {
		push_filter : function () {
			let value =  $("input#" + this.id)[0].value;
			if (this.filters.indexOf(value) < 0) {
				if (value.length > 0) {
					this.filters.push(value);
					UIkit.modal($("#modal-" + this.id)).hide();
					// reseting input
					$("input#" + this.id)[0].value = "";
					this.$emit("update-filter", {key : this.name, value: this.filters});
				} else {
					Notification.warning("Can't add an empty value.");
				}
			} else {
				Notification.warning(value + " is already in list.");
			}
		},
		delete_filter : function(value) {
			this.filters.splice(this.filters.indexOf(value), 1);
			this.$emit("update-filter", {key :this.name, value: this.filters});
		},
	},
	created () {
		this.id = get_random_uuid();
	},
	delimiters: ["${","}"],
	template:"#filter-array",
};

Filter.Object = {
	props : {
		"name" : String,
		"filters" : Object,
	},
	data () {
		return {
			"id": null
		};
	},
	methods : {
		push_filter : function () {
			let key = $("input#key-" + this.id)[0].value;
			let value = $("input#value-" + this.id)[0].value;
			if (key.length > 0 && value.length > 0) {
				Vue.set(this.filters, key, value);
				// reseting inputs
				$("input#key-" + this.id)[0].value = $("input#value-" + this.id)[0].value = "";
				this.$emit("update-filter", {key : this.name, value: this.filters});
				UIkit.modal($("#modal-" + this.id)).hide();
			} else {
				Notification.warning("Can't add an empty key-value.");
			}
		},
		delete_filter : function (key) {
			Vue.delete(this.filters, key);
			this.$emit("update-filter", {key : this.name, value: this.filters});
		},
	},
	created () {
		this.id = get_random_uuid();
	},
	delimiters: ["${","}"],
	template:"#filter-object",
};

Filter.Date = {
	props : {
		"name" : String,
		"date" : String,
	},
	data () {
		return {
			"timeout_id" : null
		};
	}, 
	created () {
		tail.DateTime("#" + this.name, { closeButton : false });
	},
	methods : {
		show_date_picker () {
			tail.DateTime("#" + this.name).toggle();
		}
	},
	watch : {
		date () {
			if (this.timeout_id != null)
				clearTimeout(this.timeout_id);
			this.timeout_id = setTimeout(() => { 
				this.$emit("update-filter", {key : this.name, value: this.date});	
			}, 1500)
		}
	},
	delimiters: ["${","}"],
	template:"#filter-date",
};

Filter.Input = {
	props : {
		"name" : String,
		"filter" : String,
	},
	data () {
		return {
			"timeout_id" : null
		};
	},
	watch : {
		filter () {
			if (this.timeout_id != null)
				clearTimeout(this.timeout_id);
			this.timeout_id = setTimeout(() => { 
				this.$emit("update-filter", {key : this.name, value: this.filter});
			}, 500)
		}
	},
	delimiters: ["${","}"],
	template:"#filter-input",
};

Filter.Select = {
	props : {
		"name" : String,
		"select_possibilities" : Array,
		"filter" : String,
	},
	watch : {
		filter () {
			this.$emit("update-filter", {key : this.name, value: this.filter});
		}
	},
	delimiters: ["${","}"],
	template:"#filter-select",
};

export default Filter;
