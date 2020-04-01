/* Dashboard Notifications */

var Notification = {}

Notification.TIMEOUT = 5000;
Notification.POSITION = "top-right";

Notification.success = function(message) {
	message = "<i class='fas fa-check'></i> " + message;
	UIkit.notification({
	    message: message,
		status: "success",
		timeout: Notification.TIMEOUT,
		pos: Notification.POSITION
	});
}

Notification.warning = function(message) {
	message = "<i class='fas fa-exclamation-triangle'></i> " + message;
	UIkit.notification({
	    message: message,
		status: "warning",
		timeout: Notification.TIMEOUT,
		pos: Notification.POSITION
	});
}

Notification.error = function(message) {
	message = "<i class='fas fa-times'></i> " + message;
	UIkit.notification({
	    message: message,
		status: "danger",
		timeout: Notification.TIMEOUT,
		pos: Notification.POSITION
	});
}
