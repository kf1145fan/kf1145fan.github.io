/**
 * Akismet spam detection client.
 * Returns true if the comment is detected as spam.
 */
export async function checkAkismet(
	apiKey: string,
	blogUrl: string,
	params: {
		ip: string;
		ua: string;
		comment: string;
		author: string;
		email: string;
		pageUrl: string;
	},
): Promise<boolean> {
	const endpoint = `https://${apiKey}.rest.akismet.com/1.1/comment-check`;

	const body = new URLSearchParams({
		blog: blogUrl || "http://localhost",
		user_ip: params.ip,
		user_agent: params.ua,
		referrer: params.pageUrl,
		comment_type: "comment",
		comment_author: params.author,
		comment_author_email: params.email,
		comment_content: params.comment,
	});

	try {
		const resp = await fetch(endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"User-Agent": "Waline-On-Worker | waline@worker",
			},
			body: body.toString(),
		});

		if (!resp.ok) return false;

		const text = await resp.text();
		return text.trim() === "true";
	} catch {
		return false;
	}
}
