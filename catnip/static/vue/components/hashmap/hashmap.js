
import HashmapService from "./hashmap-service.js";
import HashmapGroup from "./hashmap-group.js";

var Hashmap = {};

Hashmap.Main = {
	data () {
		return {
			"current_view" : "service",
			// menu_info contains the qty of items per module, if -1, client is fetching module data.
			"menu_info" : {
				"service" : -1,
				"group" : -1,
			}
		};
	},
	methods : {
		update_menu_info : function (info) {
			this.menu_info[info.key] = info.value;
		}
	},
	components : {
		"hashmap-service-table" : HashmapService.Table,
		"hashmap-group-table" : HashmapGroup.Table
	},
	delimiters: ["${","}"],
	template:"#hashmap-main"
};

export default Hashmap;
