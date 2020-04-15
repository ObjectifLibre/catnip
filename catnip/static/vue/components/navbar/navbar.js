import { EventBus } from "../event-bus/event-bus.js";

var Navbar = {
	data () {
		return {
			"theme": "default",
			"icon_mode": "fas fa-moon", 
			"project_list": [],
			"current_project_id": null,
			"url_params": {
				"filters": {},
			},
			"is_pending":false,
			"is_loaded": false
		};
	},
	methods : {
		switch_theme : function () {
			(this.theme == "default") ? (this.theme = "dark") : (this.theme = "default");
			Service.set_cookie("theme", this.theme, 10);
		},
		switch_project : function (project_id) {
			if (project_id == null) {
				Notification.success("Successfully switched to ALL");
				this.current_project_id = project_id;
				this.apply_filter_project();
			}
			else {
				this.is_pending = true;
				Service.update(Service.URL_PROJECT, {"project_id": project_id})
				.then(response => {
					Notification.success(response);
					this.current_project_id = project_id;
					this.apply_filter_project();
				}).catch(error => {
					Notification.error(error);
				}).finally(() => {
					this.is_pending = false;
				})
			}
		},
		_get : function() {
			this.is_pending = true;
			Service.get(Service.URL_PROJECT)
			.then(response => {
				this.project_list = response.project_list;
				if (this.url_params["filters"]["project_id"] != undefined &&
					this.url_params["filters"]["project_id"] in this.project_list)
					this.current_project_id = this.url_params["filters"]["project_id"];
				else
					this.current_project_id = null;
				this.is_loaded = true;
				this.apply_filter_project();
			}).catch(error => {
				Notification.error(error);
			}).finally(() => {
				this.is_pending = false;
			})
		},
		reload_project_list : function() {
			this.is_pending = true;
			Service.get(Service.URL_PROJECT, {"reload": true})
			.then(response => {
				Notification.success("Successfully reload project list");
				this.project_list = response.project_list;
				if (!(this.current_project_id in this.project_list)) {
					this.current_project_id = null;
					this.apply_filter_project();
				}
				this.is_loaded = true;
			}).catch(error => {
				Notification.error("Failed to update project list");
			}).finally(() => {
				this.is_pending = false;
			})
		},
		apply_filter_project: function() {
			// update url_params in case the url has been modified by components
			URLManager.parse_query_params(this.url_params, this.$route.query);

			// if the project selected is set to "ALL" we remove the filter on project_id
			if (this.current_project_id == null)
				delete this.url_params["filters"]["project_id"];
			else
				this.url_params["filters"]["project_id"] = this.current_project_id;

			URLManager.apply_filter_to_url(this.url_params, this.$router, this.$route.name);
			EventBus.$emit("switching-project", this.current_project_id);
		}
	},
	created : function () {
		// check if dark mode preference is set
		this.theme = Service.get_cookie("theme");
		if (this.theme != "default" && this.theme != "dark")
			this.theme = "default";

		// set url_params 
		URLManager.parse_query_params(this.url_params, this.$route.query);
		this._get();
	},
	computed : {
		project_name : function() {
			if (this.current_project_id == null)
				return "ALL";
			return this.project_list[this.current_project_id];
		}
	},
	watch : {
		theme : {
			immediate: true,
			handler(newVal, oldVal) {
				// switch icons sun - moon
				(newVal == "dark") ? (this.icon_mode = "fas fa-sun") : (this.icon_mode = "fas fa-moon");

				// check which theme is used
				if ($("#catnip-dark-theme").length > 0) {
					if (newVal == "dark")
						$("#inverted-theme").remove();
					else
						$("head").append("<link rel='stylesheet' id='inverted-theme' href='/static/css/catnip/catnip-light.css' type='text/css'/>");
				}
				else if ($("#catnip-light-theme").length > 0) {
					if (newVal != "dark")
						$("#inverted-theme").remove();
					else
						$("head").append("<link rel='stylesheet' id='inverted-theme' href='/static/css/catnip/catnip-dark.css' type='text/css'/>");
				}
			}
		},
	},
	delimiters : ["${", "}"],
	template:"#navbar"
}

export default Navbar;
