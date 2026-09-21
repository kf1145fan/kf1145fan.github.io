import type { Env } from "../env.js";
import { getSettings } from "../router/settings.js";

/**
 * Review a comment using an OpenAI-compatible LLM endpoint.
 * Returns 'approved' or 'spam' on success, or the provided defaultStatus on failure/disabled.
 * llm_mode: 'off' | 'anonymous' | 'all' (controls when LLM review runs; caller decides whether to call)
 */
export async function reviewComment(
	db: D1Database,
	env: Env,
	commentText: string,
	_nick: string,
	_url: string,
	defaultStatus: string,
): Promise<string> {
	const settings = await getSettings(db, [
		"llm_endpoint",
		"llm_api_key",
		"llm_model",
		"llm_prompt",
	]);

	const endpoint = env.LLM_ENDPOINT || settings.llm_endpoint;
	const apiKey = env.LLM_API_KEY || settings.llm_api_key;
	const model = env.LLM_MODEL || settings.llm_model || "gpt-4o-mini";
	const systemPrompt =
		env.LLM_PROMPT ||
		settings.llm_prompt ||
		"You are a review bot. Your task is to review the comments according to following rules: " +
			"1. Any contact information should not be included, including qq number, email, phone number, etc. " +
			"2. Any content with advertising or sensitive information should not be included. " +
			"3. Any other content that is not suitable for public display should not be included. " +
			"4. Output should be a single word(approved/spam).";

	if (!endpoint || !apiKey) return defaultStatus;

	try {
		const response = await fetch(endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model: model,
				messages: [
					{ role: "system", content: systemPrompt },
					{ role: "user", content: commentText },
				],
			}),
		});

		if (!response.ok) return defaultStatus;

		const data = (await response.json()) as any;
		const content = data?.choices?.[0]?.message?.content?.trim()?.toLowerCase();
		if (!content) return defaultStatus;

		if (content === "approved" || content === "spam") return content;
		return "waiting";
	} catch {
		return defaultStatus;
	}
}
