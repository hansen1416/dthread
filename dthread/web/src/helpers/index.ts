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

export function sleep(ms: number) {
	const now = Date.now();
	const limit = now + ms;
	let execute = true;
	while (execute) {
		if (limit < Date.now()) {
			execute = false;
		}
	}
	return;
}

export function timestampToString(timestamp: number): string {
	if (!timestamp) {
		return "";
	}
	return (
		new Date(timestamp * 1000).toLocaleDateString("en-US") +
		" " +
		new Date(timestamp * 1000).toLocaleTimeString("en-US")
	);
}
