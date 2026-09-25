-- 访问量统计
-- wl_Visit：按天累计访问量（total = SUM(count)，today = 当天行的 count）
CREATE TABLE IF NOT EXISTS "wl_Visit" (
  "day" TEXT PRIMARY KEY,
  "count" INTEGER NOT NULL DEFAULT 0
);

-- wl_VisitVisitor：按天去重访客（同一访客当天只计一次）
CREATE TABLE IF NOT EXISTS "wl_VisitVisitor" (
  "day" TEXT NOT NULL,
  "visitor" TEXT NOT NULL,
  PRIMARY KEY ("day", "visitor")
);