var HashmapGroup = {};

HashmapGroup.Row = {
	props : {
		"group" : Object
	},
	data () {
		return {
			"hover" : false
		} 
	},
	methods : {
		_delete : function() {
			Service.delete(Service.URL_HASHMAP_GROUP, {group_id : this.group.group_id})
			.then(response => {
				Notification.success("Group successfully deleted  (" + this.group.group_id + ").");
				this.$emit("delete-group", this.group.group_id);
			}).catch(error => {
				Notification.error(error);
			})
		}
	},
	delimiters: ["${","}"],
	template:"#hashmap-group-row"
};

HashmapGroup.RowCreation = {
	data () {
		return {
			"new_group" : {
				"name" : ""
			},
			"description" : "A group is a way to group calculations of mappings."
		}
	},
	methods : {
		_create : function () {
			Service.create(Service.URL_HASHMAP_GROUP, this.new_group)
			.then(response => {
				Notification.success("Group successfully created.");
				this.$emit("create-group", response);
				this.$emit("close-creation");
			})
			.catch(error => {
				Notification.error(error);
			})
		}
	},
	delimiters: ["${","}"],
	template:"#hashmap-group-row-creation"
};

HashmapGroup.Table = {
	data () {
		return {
			"status": {
				"creating" : false,
				"loading" : false,
				"data_loaded" : false
			},
			"groups" : []
		}
	},
	created : function () {
		this._get();
	},
	methods : {
		_get: function() {
			if (this.status.data_loaded)
				return ;
			this.status.loading = true;
			this.$emit("update-menu-info", {key: "group", value: -1});
			Service.get(Service.URL_HASHMAP_GROUP)
			.then(response => {
				this.groups = response.groups;
				this.status.data_loaded = true;
			})
			.catch (error => {
				this.groups = [];
				Notification.error(error);
			})
			.finally(() => {
				this.status.loading = false;
				this.$emit("update-menu-info", {key: "group", value: this.groups.length});
			})
		},
		delete_row: function(group_id) {
			for (var idx in this.groups) {
				if (this.groups[idx].group_id == group_id) {
					this.groups.splice(idx, 1);
					break;
				}
			}
			this.$emit("update-menu-info", {key: "group", value: this.groups.length});
		},
		create_row: function(new_group) {
			this.groups.push(new_group);
			this.$emit("update-menu-info", {key: "group", value: this.groups.length});
		}
	},
	components : {
		"hashmap-group-row" : HashmapGroup.Row,
		"hashmap-group-row-creation" : HashmapGroup.RowCreation 
	},
	delimiters: ["${","}"],
	template: "#hashmap-group-table"
};

export default HashmapGroup;
