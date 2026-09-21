import { Hono } from "hono";
import type { Env, Variables } from "../env.js";

export const settingsRoutes = new Hono<{
	Bindings: Env;
	Variables: Variables;
}>();

const ALLOWED_KEYS = new Set([
	"waline_client_version",
	"waline_admin_version",
	"comment_default_status",
	"user_comment_default_status",
	"worker_display",
	"spam_mode",
	"akismet_key",
	"llm_mode",
	"llm_skip_admin",
	"llm_endpoint",
	"llm_api_key",
	"llm_model",
	"llm_prompt",
]);

/**
 * GET /api/settings - Get all settings (admin only)
 */
settingsRoutes.get("/", async (c) => {
	const userInfo = c.get("userInfo");
	if (userInfo?.type !== "administrator") {
		return c.json({ errno: 1, errmsg: "Unauthorized" }, 403);
	}

	const result = await c.env.DB.prepare(
		"SELECT key, value FROM wl_Settings",
	).all();

	// Sensitive keys that must be masked in API responses
	const MASKED_KEYS = new Set(["llm_api_key", "akismet_key"]);

	const settings: Record<string, string> = {};
	for (const row of result.results) {
		const key = row.key as string;
		const value = row.value as string;
		if (MASKED_KEYS.has(key) && value) {
			// Show first 4 and last 4 chars: "sk-a****bcde" (recognizable + masked)
			settings[key] =
				value.length > 8
					? `${value.slice(0, 4)}****${value.slice(-4)}`
					: `${value.slice(0, 1)}****`;
		} else {
			settings[key] = value;
		}
	}

	return c.json({
		errno: 0,
		errmsg: "",
		data: settings,
		env_overrides: getEnvOverrides(c.env),
	});
});

/**
 * PUT /api/settings - Update settings (admin only)
 * Body: { key: value, ... }
 */
settingsRoutes.put("/", async (c) => {
	const userInfo = c.get("userInfo");
	if (userInfo?.type !== "administrator") {
		return c.json({ errno: 1, errmsg: "Unauthorized" }, 403);
	}

	const body = await c.req.json();
	const stmts: D1PreparedStatement[] = [];

	for (const [key, value] of Object.entries(body)) {
		if (!ALLOWED_KEYS.has(key)) continue;
		stmts.push(
			c.env.DB.prepare(
				`INSERT INTO wl_Settings (key, value, updatedAt) VALUES (?, ?, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt`,
			).bind(key, String(value)),
		);
	}

	if (stmts.length > 0) {
		await c.env.DB.batch(stmts);
	}

	return c.json({ errno: 0, errmsg: "" });
});

/**
 * Helper: Get a single setting value
 */
export async function getSetting(
	db: D1Database,
	key: string,
): Promise<string | null> {
	const row = await db
		.prepare("SELECT value FROM wl_Settings WHERE key = ?")
		.bind(key)
		.first();
	return row ? (row.value as string) : null;
}

/**
 * Helper: Get multiple settings at once
 */
export async function getSettings(
	db: D1Database,
	keys: string[],
): Promise<Record<string, string>> {
	const placeholders = keys.map(() => "?").join(",");
	const result = await db
		.prepare(
			`SELECT key, value FROM wl_Settings WHERE key IN (${placeholders})`,
		)
		.bind(...keys)
		.all();

	const settings: Record<string, string> = {};
	for (const row of result.results) {
		settings[row.key as string] = row.value as string;
	}
	return settings;
}

/**
 * Returns a set of setting keys that are currently overridden by environment variables.
 * The frontend uses this to disable the corresponding inputs.
 */
function getEnvOverrides(env: Env): string[] {
	const overrides: string[] = [];
	const envKeys: [string | undefined, string][] = [
		[env.AKISMET_KEY, "akismet_key"],
		[env.LLM_ENDPOINT, "llm_endpoint"],
		[env.LLM_API_KEY, "llm_api_key"],
		[env.LLM_MODEL, "llm_model"],
		[env.LLM_PROMPT, "llm_prompt"],
		[env.SPAM_MODE, "spam_mode"],
		[env.LLM_SKIP_ADMIN, "llm_skip_admin"],
	];
	for (const [val, key] of envKeys) {
		if (val && val.length > 0) overrides.push(key);
	}
	return overrides;
}
