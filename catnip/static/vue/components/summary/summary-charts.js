import { EventBus } from "../event-bus/event-bus.js";
import Filter from "../filter/filter.js";

var SummaryCharts = {};

SummaryCharts.BACKGROUND_COLORS = [
	"hsla(320, 100%, 70%, 0.75)",
	"hsla(280, 100%, 70%, 0.75)",
	"hsla(207, 100%, 70%, 0.75)",
	"hsla(177, 100%, 70%, 0.75)",
	"hsla(132, 70%, 60%, 0.75)",
	"hsla(87, 98%, 70%, 0.75)",
	"hsla(163, 56%, 40%, 0.75)",
	"hsla(30, 100%, 50%, 0.75)",
	"hsla(50, 100%, 50%, 0.75)",
	"hsla(350, 100%, 70%, 0.75)",
	"hsla(19, 46%, 36%, 0.75)",
	"hsla(266, 56%, 51%, 0.75)",
	"hsla(340, 50%, 70%, 0.75)",
	"hsla(240, 100%, 70%, 0.75)",
	"hsla(200, 82%, 45%, 0.75)",
	"hsla(130, 24%, 48%, 0.75)",
	"hsla(76, 100%, 43%, 0.75)",
	"hsla(146, 100%, 52%, 0.75)",
	"hsla(74, 60%, 70%, 0.75)",
	"hsla(22, 70%, 70%, 0.75)",
	"hsla(39, 100%, 73%, 0.75)",
	"hsla(360, 100%, 73%, 0.75)",
	"hsla(353, 45%, 45%, 0.75)",
	"hsla(36, 27%, 47%, 0.75)"
];

SummaryCharts.BORDER_COLORS = [
	"hsla(320, 100%, 70%, 1)",
	"hsla(280, 100%, 70%, 1)",
	"hsla(207, 100%, 70%, 1)",
	"hsla(177, 100%, 70%, 1)",
	"hsla(132, 70%, 60%, 1)",
	"hsla(87, 98%, 70%, 1)",
	"hsla(163, 56%, 40%, 1)",
	"hsla(30, 100%, 50%, 1)",
	"hsla(50, 100%, 50%, 1)",
	"hsla(350, 100%, 70%, 1)",
	"hsla(19, 46%, 36%, 1)",
	"hsla(266, 56%, 51%, 1)",
	"hsla(340, 50%, 70%, 1)",
	"hsla(240, 100%, 70%, 1)",
	"hsla(200, 82%, 45%, 1)",
	"hsla(130, 24%, 48%, 1)",
	"hsla(76, 100%, 43%, 1)",
	"hsla(146, 100%, 52%, 1)",
	"hsla(74, 60%, 70%, 1)",
	"hsla(22, 70%, 70%, 1)",
	"hsla(39, 100%, 73%, 1)",
	"hsla(360, 100%, 73%, 1)",
	"hsla(353, 45%, 45%, 1)",
	"hsla(36, 27%, 47%, 1)"
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
				doughnut_colors.push(SummaryCharts.BORDER_COLORS[coloridx % SummaryCharts.BORDER_COLORS.length]);
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
						mode: "x",
						titleFontSize: 14,
						bodySpacing: 5,
						intersect: false,
						callbacks: {
							label: function(tooltipItem, data) {
			                    var label = data.datasets[tooltipItem.datasetIndex].label || '';
			                    if (label) {
			                        label += ': ';
			                    }
			                    label += Math.round(tooltipItem.yLabel * 100) / 100;
			                    return label;
			                },
			                labelColor: function(tooltipItem, chart) {
			                    return {
			                        borderColor: chart.data.datasets[tooltipItem.datasetIndex].borderColor,
			                        backgroundColor: chart.data.datasets[tooltipItem.datasetIndex].borderColor
			                    };
			                },
			                labelTextColor: function(tooltipItem, chart) {
			                	return chart.data.datasets[tooltipItem.datasetIndex].borderColor;
			                }
			            }
					},
					hover: {
						mode: "x",
						intersect: false,
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
			        borderJoinStyle: "bevel",
			        backgroundColor: SummaryCharts.BACKGROUND_COLORS[coloridx % SummaryCharts.BACKGROUND_COLORS.length],
			       	borderColor: SummaryCharts.BORDER_COLORS[coloridx % SummaryCharts.BORDER_COLORS.length],
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
	created: function() {
		// Legend is html_legend load as v-html
		// It can be modified out of summary-charts view when user switches project
		EventBus.$on("init-legend-event", () => {
			setTimeout(() => {
				// Legend's html is load in v-html,
				// we have to wait vuejs to update it before add event listeners on legend elements.
				if (this.html_legend.length > 0) {
					var legendContainer = $("#legend-container")[0];
					if (legendContainer == undefined)
						return ;
					var legendItems = $("#legend-container ul li");
					for (var i = 0; i < legendItems.length; i += 1) {
					 	legendItems[i].addEventListener("click", this.legendClickCallback, false);
					}
				}
			}, 500)
		})
	},
	watch : {
		$route: function() {
			if (this.$route.name == "summary charts") {
				EventBus.$emit('init-legend-event')
			}
		},
		html_legend : function () {
			EventBus.$emit('init-legend-event')
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
			"set_up": false,
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
  			if (project_id != this.url_params["filters"]["project_id"]) {
				Vue.set(this.url_params["filters"], "project_id", project_id);
				this._get();
	  		}
		});

		URLManager.parse_query_params(this.url_params, this.$route.query);
		// if there is no project_id filter in url_params, we set it to null to get ALL projects
		if (this.url_params["filters"]["project_id"] === undefined)
			Vue.set(this.url_params["filters"], "project_id", null);
		this._get();
	},
	delimiters: ["${","}"],
	template:"#summary-charts",
};

export default SummaryCharts;
