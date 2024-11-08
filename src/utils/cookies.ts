export const setCookie = (name: string, value: string, days?: number) => {
	const expiry = new Date();
	if (days !== undefined) {
		expiry.setTime(expiry.getTime() + days * 24 * 60 * 60 * 1000);
	} else {
		expiry.setFullYear(9999);
	}
	const expires = `expires=${expiry.toUTCString()}`;
	document.cookie = `${name}=${value}; ${expires}; path=/`;
};

export const getCookie = (name: string): string | null => {
	const nameEQ = `${name}=`;
	const ca = document.cookie.split(';');
	for (let c of ca) {
		while (c.charAt(0) === ' ') c = c.substring(1);
		if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
	}
	return null;
};
