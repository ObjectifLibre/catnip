var FormatData = {};

const NUMBER_OF_DECIMALS = 2;
const DATE_FORMAT_OPTIONS =  { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" };

FormatData.format_date = function(date_to_format) {
	let timestamp = Date.parse(date_to_format);
	let date = new Date(timestamp);
	return date.toLocaleDateString(undefined, DATE_FORMAT_OPTIONS);
};

FormatData.format_number = function(number) {
	return number.toFixed(NUMBER_OF_DECIMALS);
};

FormatData.format_data = function(data) {
	if (typeof data == "number")
		return FormatData.format_number(data);
	if (typeof data == "string" && Date.parse(data))
		return FormatData.format_date(data);
	return data;
};
