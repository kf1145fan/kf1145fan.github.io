-- 访问量统计：按天累计（total = SUM(count)，today = 当天行的 count）
CREATE TABLE IF NOT EXISTS "wl_Visit" (
  "day" TEXT PRIMARY KEY,
  "count" INTEGER NOT NULL DEFAULT 0
);