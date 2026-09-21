/**
 * CORS origin allowlist helpers.
 * A domain matches if it equals an allowed entry or is a subdomain of it.
 */
export function originAllowed(
	origin: string,
	allowlist: string,
): boolean {
	const allowed = (allowlist || "")
		.split(",")
		.map((d: string) => d.trim())
		.filter(Boolean);

	if (allowed.length === 0) return true;

	try {
		const url = new URL(origin);
		const host = url.hostname.toLowerCase();
		return allowed.some((d: string) => {
			const dd = d.toLowerCase().replace(/^https?:\/\//, "").replace(/^\*\./, "");
			return host === dd || host.endsWith("." + dd);
		});
	} catch {
		return false;
	}
}