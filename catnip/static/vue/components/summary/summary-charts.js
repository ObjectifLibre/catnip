import { EventBus } from "../event-bus/event-bus.js";
import Filter from "../filter/filter.js";

var SummaryCharts = {};

SummaryCharts.BACKGROUND_COLORS = [
	"hsla(207,80%,70%,0.3)",
	"hsla(103,80%,70%,0.3)",
	"hsla(292,80%,70%,0.3)",
	"hsla(181,80%,70%,0.3)",
	"hsla(30,80%,70%,0.3)",
	"hsla(48,80%,70%,0.3)",
	"hsla(239,80%,70%,0.3)",
	"hsla(74,80%,70%,0.3)",
	"hsla(340,80%,70%,0.3)",
	"hsla(22,80%,70%,0.3)",
	"hsla(328,80%,70%,0.3)",
	"hsla(170,80%,70%,0.3)",
	"hsla(248,80%,70%,0.3)",
	"hsla(6,80%,70%,0.3)",
	"hsla(205,80%,70%,0.3)",
	"hsla(32,80%,70%,0.3)",
	"hsla(329,80%,70%,0.3)",
	"hsla(299,80%,70%,0.3)",
	"hsla(53,80%,70%,0.3)",
	"hsla(201,80%,70%,0.3)",
	"hsla(41,80%,70%,0.3)",
	"hsla(162,80%,70%,0.3)",
	"hsla(26,80%,70%,0.3)",
	"hsla(329,80%,70%,0.3)",
	"hsla(44,80%,70%,0.3)",
	"hsla(39,80%,70%,0.3)",
	"hsla(204,80%,70%,0.3)",
	"hsla(150,80%,70%,0.3)",
	"hsla(13,80%,70%,0.3)",
	"hsla(111,80%,70%,0.3)",
	"hsla(220,80%,70%,0.3)",
	"hsla(258,80%,70%,0.3)",
	"hsla(90,80%,70%,0.3)",
	"hsla(354,80%,70%,0.3)",
	"hsla(34,80%,70%,0.3)",
	"hsla(18,80%,70%,0.3)",
	"hsla(212,80%,70%,0.3)",
	"hsla(39,80%,70%,0.3)",
	"hsla(61,80%,70%,0.3)",
	"hsla(340,80%,70%,0.3)",
	"hsla(49,80%,70%,0.3)",
	"hsla(47,80%,70%,0.3)",
	"hsla(226,80%,70%,0.3)",
	"hsla(0,80%,70%,0.3)",
	"hsla(156,80%,70%,0.3)",
	"hsla(30,80%,70%,0.3)",
	"hsla(169,80%,70%,0.3)",
	"hsla(45,80%,70%,0.3)",
	"hsla(207,80%,70%,0.3)",
	"hsla(338,80%,70%,0.3)",
	"hsla(311,80%,70%,0.3)",
	"hsla(177,80%,70%,0.3)",
	"hsla(262,80%,70%,0.3)",
	"hsla(337,80%,70%,0.3)",
	"hsla(53,80%,70%,0.3)",
	"hsla(33,80%,70%,0.3)",
	"hsla(185,80%,70%,0.3)",
	"hsla(303,80%,70%,0.3)",
	"hsla(350,80%,70%,0.3)",
];

SummaryCharts.BORDER_COLORS = [
	
	"hsla(207,80%,70%,1)",
	"hsla(103,80%,70%,1)",
	"hsla(292,80%,70%,1)",
	"hsla(181,80%,70%,1)",
	"hsla(30,80%,70%,1)",
	"hsla(48,80%,70%,1)",
	"hsla(239,80%,70%,1)",
	"hsla(74,80%,70%,1)",
	"hsla(340,80%,70%,1)",
	"hsla(22,80%,70%,1)",
	"hsla(328,80%,70%,1)",
	"hsla(170,80%,70%,1)",
	"hsla(248,80%,70%,1)",
	"hsla(6,80%,70%,1)",
	"hsla(205,80%,70%,1)",
	"hsla(32,80%,70%,1)",
	"hsla(329,80%,70%,1)",
	"hsla(299,80%,70%,1)",
	"hsla(53,80%,70%,1)",
	"hsla(201,80%,70%,1)",
	"hsla(41,80%,70%,1)",
	"hsla(162,80%,70%,1)",
	"hsla(26,80%,70%,1)",
	"hsla(329,80%,70%,1)",
	"hsla(44,80%,70%,1)",
	"hsla(39,80%,70%,1)",
	"hsla(204,80%,70%,1)",
	"hsla(150,80%,70%,1)",
	"hsla(13,80%,70%,1)",
	"hsla(111,80%,70%,1)",
	"hsla(220,80%,70%,1)",
	"hsla(258,80%,70%,1)",
	"hsla(90,80%,70%,1)",
	"hsla(354,80%,70%,1)",
	"hsla(34,80%,70%,1)",
	"hsla(18,80%,70%,1)",
	"hsla(212,80%,70%,1)",
	"hsla(39,80%,70%,1)",
	"hsla(61,80%,70%,1)",
	"hsla(340,80%,70%,1)",
	"hsla(49,80%,70%,1)",
	"hsla(47,80%,70%,1)",
	"hsla(226,80%,70%,1)",
	"hsla(0,80%,70%,1)",
	"hsla(156,80%,70%,1)",
	"hsla(30,80%,70%,1)",
	"hsla(169,80%,70%,1)",
	"hsla(45,80%,70%,1)",
	"hsla(207,80%,70%,1)",
	"hsla(338,80%,70%,1)",
	"hsla(311,80%,70%,1)",
	"hsla(177,80%,70%,1)",
	"hsla(262,80%,70%,1)",
	"hsla(337,80%,70%,1)",
	"hsla(53,80%,70%,1)",
	"hsla(33,80%,70%,1)",
	"hsla(185,80%,70%,1)",
	"hsla(303,80%,70%,1)",
	"hsla(350,80%,70%,1)",
];

SummaryCharts.CostRepartition = {
	props : {
		"is_loading" : Boolean,
		"computed_data" : Object,
	},
	data () {
		return {
			"context" : null,
			"chart" : null,
			"legendHTML" : ""
		};
	},
	methods : {
		create_chart() {
			this.context = document.getElementById("summary-cost-repartition-canvas").getContext("2d");
			this.chart = new Chart(this.context, {
			    type: "doughnut",
			    data: this.get_datasets(this.computed_data),
			    options: {
			    	legend: {
        			    display: false,
        			},
				    hover: {
				      	animationDuration: 0 // duration of animations when hovering an item
				    },
				    responsiveAnimationDuration: 0, // animation duration after a resize
			    }
			});
		},
		update_chart() {
			let chartdata = this.get_datasets(this.computed_data);
			this.chart.data.datasets = chartdata.datasets;
			this.chart.data.labels = chartdata.labels;
			this.chart.update();
		},
		get_datasets : function (computed_data) {
			var data = {};
			data.datasets = [];
			if (!("data" in computed_data))
				return data;
			let coloridx = 0;
			let doughnut_data = [];
			let doughnut_labels = [];
			let doughnut_colors = [];
			for (let key in computed_data.data) {
				doughnut_data.push(computed_data.data[key].reduce((p, c) => p + c, 0));
				doughnut_labels.push(key);
				doughnut_colors.push(SummaryCharts.BORDER_COLORS[coloridx]);
				coloridx++;
			}
			data.datasets.push({
				backgroundColor: doughnut_colors,
				borderColor: "#000000",
				borderWidth:1,
				data: doughnut_data,
			})
			data.labels = doughnut_labels;
			return data;
		}
	},
	template:"#summary-cost-repartition",
	watch : {
		computed_data () {
			if (this.chart == null)
				this.create_chart();
			else
				this.update_chart();
			this.$emit("html-legend-chart", this.chart.generateLegend());
		}
	},
};

SummaryCharts.CostService = {
	props : {
		"is_loading" : Boolean,
		"computed_data" : Object,
	},
	data () {
		return {
			"context" : null,
			"chart" : null,
		};
	},
	methods : {
		update_chart () {
			let chartdata = this.get_datasets(this.computed_data);
			this.chart.data.datasets = chartdata.datasets;
			this.chart.update();
		},
		create_chart : function () {
			this.context = document.getElementById("summary-cost-service-canvas").getContext("2d");
			this.chart = new Chart(this.context, {
			    type: "line",
			    data: this.get_datasets(this.computed_data),
			    options: {
					responsive: true,
					tooltips: {
						mode: "x"
					},
					hover: {
						mode: "x",
						animationDuration: 0 // duration of animations when hovering an item
					},
					scales: {
						xAxes: [{
							type: "time",
                			time: {
                				unit: "hour",
                				displayFormats: {
			                        hour: "hA - DD/MM"
			                    },
			                },
							scaleLabel: {
								display: true,
								labelString: "Time"
							}
						}],
						yAxes: [{
							stacked: true,
							scaleLabel: {
								display: true,
								labelString: "Cost"
							}
						}]
					},
					legend: {
        			    display: false,
        			},
				    responsiveAnimationDuration: 0, // animation duration after a resize
				    elements: {
				      line: {
				        tension: 0 // disables bezier curves
				      }
				    }
				}
			});
		},
		
		get_datasets : function (computed_data) {
			var data = {};
			data.datasets = [];
			if (!("data" in computed_data))
				return data;
			let coloridx = 0;
			for (let key in computed_data.data) {
				let data_by_time = [];
				for (let idx in computed_data.data[key]) {
					data_by_time.push({t: computed_data.labels[idx], y: computed_data.data[key][idx]});
				}
				data.datasets.push({
			        label: key,
			        lineTension : 0,
			        borderWidth : 2,
			        pointRadius : 1,
			        backgroundColor: SummaryCharts.BACKGROUND_COLORS[coloridx],
			       	borderColor: SummaryCharts.BORDER_COLORS[coloridx],
			        data: data_by_time,
			        spanGaps:false
			    });
				coloridx++;
			}
			return data;
		}
	},
	watch : {
		computed_data () {
			if (this.chart == null)
				this.create_chart();
			else
				this.update_chart();
		}
	},
	template:"#summary-cost-service",
};

SummaryCharts.Legend = {
	props : {
		"is_loading" : Boolean,
		"html_legend" : String
	},
	methods : {
		legendClickCallback : function (event) {
			event = event || window.event;

			var target = event.target || event.srcElement;
			while (target.nodeName !== "LI") {
			  target = target.parentElement;
			}

			var parent = target.parentElement;
			var index = Array.prototype.slice.call(parent.children).indexOf(target);
			for (let chartId in Chart.instances)
			{
				let chart_type = Chart.instances[chartId].chart.config.type;
				if (chart_type == "doughnut") {
					let meta = Chart.instances[chartId].chart.getDatasetMeta(0);
					let item = meta.data[index];
					item.hidden = item.hidden === null || item.hidden === false ? true : null;
					item.hidden === true ? target.classList.add("hidden") : target.classList.remove("hidden");
				}
				else if (chart_type == "line") {
					let meta = Chart.instances[chartId].chart.getDatasetMeta(index);
					meta.hidden = meta.hidden === null ? !Chart.instances[chartId].chart.data.datasets[index].hidden : null;
				}
				Chart.instances[chartId].update();
			}
		}
	},
	watch : {
		html_legend : function () {
			if (this.html_legend.length > 0) {
				var legendContainer = $("#legend-container")[0];
				legendContainer.innerHTML = this.html_legend;
				var legendItems = $("#legend-container ul li");
				for (var i = 0; i < legendItems.length; i += 1) {
				 	legendItems[i].addEventListener("click", this.legendClickCallback, false);
				}
			}
		}
	}, 
	template:"#summary-legend",
};

SummaryCharts.Main = {
	props: {
		"api_version": Number
	},
	components: {
		"summary-cost-repartition" : SummaryCharts.CostRepartition,
		"summary-cost-service" : SummaryCharts.CostService,
		"summary-legend" : SummaryCharts.Legend,
		
		"filter-array" : Filter.Array,
		"filter-object" : Filter.Object,
		"filter-date" : Filter.Date,
		"filter-input" : Filter.Input,
		"filter-select" : Filter.Select,
	},
	data () {
		return {
			"summary_data" : {},
			"summary_loading" : false,
			"url_params" : {
				"groupby": [],
				"filters" : {},
				"end" : "",
				"begin": "",
				"chart" : true,
				"threshold" : "50"
			},
			"data_computed" : {},
			"html_legend" : "",
		};
	},
	methods : {
		update_summary : function (filter_param) {
			this.url_params[filter_param.key] = filter_param.value;
			URLManager.apply_filter_to_url(this.url_params, this.$router);
			this._get();
		},
		_get : function () {
			this.summary_loading = true;
			this.url_params["chart"] = true;
			Service.get(Service.URL_SUMMARY, this.url_params)
			.then(response => {
				if (response.chart_data != undefined) {
					this.summary_data = response;
					this.compute_data(this.summary_data.chart_names, this.summary_data.chart_data);
				} else {
					this.summary_data = null;
				}
			}).catch(error => {
				this.summary_data = null;
				Notification.error(error);
			}).finally(() => {
				this.summary_loading = false;
			})
		},
		compute_data : function(chart_names, chart_data) {
			this.data_computed = {
				"labels" : [],
				"data" : {},
			}
			for (let timestamp in chart_data) {
				for (let idx in chart_names) {
					if (!(chart_names[idx] in this.data_computed.data))
						this.data_computed.data[chart_names[idx]] = [];
					if (chart_names[idx] in chart_data[timestamp])
						this.data_computed.data[chart_names[idx]].push(chart_data[timestamp][chart_names[idx]]);
					else
						this.data_computed.data[chart_names[idx]].push(null);
				}
				this.data_computed.labels.push(new Date(timestamp));
			}
		}
	},
	created : function () {
  		EventBus.$on("switching-project", (project_id) => {
  			if (project_id != this.url_params["filters"]["project_id"] || this.url_params["filters"]["project_id"] === undefined) {
  				URLManager.parse_query_params(this.url_params, this.$route.query);
				Vue.set(this.url_params["filters"], "project_id", project_id);
				this._get();
	  		}
		});
		EventBus.$emit("is-navbar-loaded");
	},
	delimiters: ["${","}"],
	template:"#summary-charts",
};

export default SummaryCharts;
