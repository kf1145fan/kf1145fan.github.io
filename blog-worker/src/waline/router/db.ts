/**
 * Database export/import routes - compatible with Waline admin migration panel
 * GET  /api/db                         - Export all data
 * POST /api/db?table=Comment           - Insert a row
 * PUT  /api/db?table=Comment&objectId=1 - Update a row
 * DELETE /api/db?table=Comment         - Clear a table
 */
import { Hono } from "hono";
import type { Env, Variables } from "../env.js";

export const dbRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Table name mapping: Waline logical name → D1 table name
const TABLE_MAP: Record<string, string> = {
	Comment: "wl_Comment",
	Counter: "wl_Counter",
	Users: "wl_Users",
};

// Allowed column names per table (prevents SQL injection via dynamic column names)
const ALLOWED_COLUMNS: Record<string, Set<string>> = {
	Comment: new Set([
		"user_id",
		"comment",
		"orig",
		"insertedAt",
		"ip",
		"link",
		"mail",
		"nick",
		"pid",
		"rid",
		"sticky",
		"status",
		"like",
		"ua",
		"url",
		"createdAt",
		"updatedAt",
	]),
	Counter: new Set([
		"time",
		"reaction0",
		"reaction1",
		"reaction2",
		"reaction3",
		"reaction4",
		"reaction5",
		"reaction6",
		"reaction7",
		"reaction8",
		"url",
		"createdAt",
		"updatedAt",
	]),
	Users: new Set([
		"display_name",
		"email",
		"password",
		"type",
		"label",
		"url",
		"avatar",
		"github",
		"twitter",
		"facebook",
		"google",
		"weibo",
		"qq",
		"2fa",
		"createdAt",
		"updatedAt",
	]),
};

// Admin-only guard
dbRoutes.use("*", async (c, next) => {
	const userInfo = c.get("userInfo");
	if (!userInfo) return c.json({ errno: 401, errmsg: "Unauthorized" }, 401);
	if (userInfo.type !== "administrator")
		return c.json({ errno: 403, errmsg: "Forbidden" }, 403);
	await next();
});

/**
 * GET /api/db - Export all tables in Waline format
 * Admin panel's request() unwraps: { __version, ...result.data }
 */
dbRoutes.get("/", async (c) => {
	const exportData: any = {
		type: "waline",
		version: 1,
		time: Date.now(),
		tables: ["Comment", "Counter", "Users"],
		data: {
			Comment: [],
			Counter: [],
			Users: [],
		},
	};

	for (const logicalName of exportData.tables) {
		const tableName = TABLE_MAP[logicalName];
		const { results } = await c.env.DB.prepare(
			`SELECT * FROM "${tableName}"`,
		).all();
		// Map D1 id → objectId for Waline admin compatibility
		exportData.data[logicalName] = (results || []).map((row: any) => ({
			...row,
			objectId: String(row.id),
		}));
	}

	return c.json({ errno: 0, data: exportData });
});

/**
 * POST /api/db?table=Comment - Insert a row into the specified table
 * Must return { errno: 0, data: { objectId } } for admin panel idMaps
 */
dbRoutes.post("/", async (c) => {
	const table = c.req.query("table");
	if (!table || !TABLE_MAP[table]) {
		return c.json({ errno: 1, errmsg: "Invalid table" }, 400);
	}

	const tableName = TABLE_MAP[table];
	const allowedCols = ALLOWED_COLUMNS[table];
	const body = await c.req.json();

	// Remove auto-generated fields
	delete body.objectId;
	delete body.id;

	// Only keep allowed, non-null columns
	const keys = Object.keys(body).filter(
		(k) => allowedCols.has(k) && body[k] !== null && body[k] !== undefined,
	);
	if (keys.length === 0) {
		return c.json({ errno: 1, errmsg: "Empty data" }, 400);
	}

	const cols = keys.map((k) => `"${k}"`).join(", ");
	const placeholders = keys.map(() => "?").join(", ");
	const values = keys.map((k) => body[k]);

	const result = await c.env.DB.prepare(
		`INSERT INTO "${tableName}" (${cols}) VALUES (${placeholders})`,
	)
		.bind(...values)
		.run();

	if (!result.success) {
		return c.json({ errno: 1, errmsg: "Insert failed" }, 500);
	}

	// Get the inserted row's ID
	const row = await c.env.DB.prepare(
		`SELECT id FROM "${tableName}" WHERE rowid = last_insert_rowid()`,
	).first();

	return c.json({
		errno: 0,
		data: { objectId: row ? String((row as any).id) : null },
	});
});

/**
 * PUT /api/db?table=Comment&objectId=1 - Update a row
 */
dbRoutes.put("/", async (c) => {
	const table = c.req.query("table");
	const objectId = c.req.query("objectId");
	if (!table || !TABLE_MAP[table] || !objectId) {
		return c.json({ errno: 1, errmsg: "Invalid table or objectId" }, 400);
	}

	const tableName = TABLE_MAP[table];
	const allowedCols = ALLOWED_COLUMNS[table];
	const body = await c.req.json();

	// Don't update these fields
	delete body.objectId;
	delete body.id;
	delete body.createdAt;

	const keys = Object.keys(body).filter(
		(k) => allowedCols.has(k) && body[k] !== null && body[k] !== undefined,
	);
	if (keys.length === 0) {
		return c.json({ errno: 0 });
	}

	const setClauses = keys.map((k) => `"${k}" = ?`).join(", ");
	const values = keys.map((k) => body[k]);

	await c.env.DB.prepare(
		`UPDATE "${tableName}" SET ${setClauses}, "updatedAt" = datetime('now') WHERE id = ?`,
	)
		.bind(...values, Number(objectId))
		.run();

	return c.json({ errno: 0 });
});

/**
 * DELETE /api/db?table=Comment - Clear all rows from a table
 */
dbRoutes.delete("/", async (c) => {
	const table = c.req.query("table");
	if (!table || !TABLE_MAP[table]) {
		return c.json({ errno: 1, errmsg: "Invalid table" }, 400);
	}

	const tableName = TABLE_MAP[table];
	await c.env.DB.prepare(`DELETE FROM "${tableName}"`).run();

	return c.json({ errno: 0 });
});
