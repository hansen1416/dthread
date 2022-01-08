export function pop_info(msg: string) {
	alert(msg);
}

export function pop_error(msg: string) {
	alert("Error:" + msg);
}

export function random_string(
	lengthOfCode: number,
	possible: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyz"
) {
	let text = "";
	for (let i = 0; i < lengthOfCode; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
