import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import { and, eq, count, min, max, desc, asc } from "drizzle-orm";
import { db, learningViews, portalResources, portalUsers } from "@workspace/db";
import {
  RecordLearningViewBody, RecordLearningViewResponse,
  GetViewingReportQueryParams, GetViewingReportResponse,
} from "@workspace/api-zod";
import { requireRole, canView } from "./portal";

const router: IRouter = Router();

function browserDevice(req: Request, res: Response) {
  const existing = req.headers.cookie?.split(";").map(c => c.trim())
    .find(c => c.startsWith("warehouse_device="))?.slice("warehouse_device=".length);
  if (existing && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existing)) {
    return existing;
  }
  // A browser identifier, never an authentication credential or hardware fingerprint.
  const id = randomUUID();
  res.cookie("warehouse_device", id, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 365 * 86400000,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  });
  return id;
}

router.post("/portal/learning-views", async (req, res): Promise<void> => {
  const user = await requireRole(req, res, "user");
  if (!user) return;
  const input = RecordLearningViewBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "A module and valid page-visit ID are required." }); return;
  }
  const { resourceId, eventId } = input.data;
  const [resource] = await db.select().from(portalResources).where(eq(portalResources.id, resourceId));
  if (!resource || resource.data.kind !== "learning" || resource.data.archived || !canView(user, resource.data)) {
    res.status(404).json({ error: "E-learning is unavailable." }); return;
  }
  const deviceId = browserDevice(req, res);
  await db.insert(learningViews).values({ id: eventId, userId: user.id, resourceId, deviceId })
    .onConflictDoNothing({ target: learningViews.id });
  const [view] = await db.select().from(learningViews).where(eq(learningViews.id, eventId));
  if (!view || view.userId !== user.id || view.resourceId !== resourceId) {
    res.status(409).json({ error: "That page-visit ID was already used." }); return;
  }
  res.setHeader("Cache-Control", "no-store");
  res.json(RecordLearningViewResponse.parse({ id: view.id, openedAt: view.openedAt.toISOString() }));
});

router.get("/portal/viewing-report", async (req, res): Promise<void> => {
  if (!await requireRole(req, res, "manager")) return;
  const params = GetViewingReportQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: "Invalid report filters." }); return; }
  const conditions = [];
  if (params.data.userId) conditions.push(eq(learningViews.userId, params.data.userId));
  if (params.data.resourceId) conditions.push(eq(learningViews.resourceId, params.data.resourceId));
  const [rows, people, resources] = await Promise.all([
    db.select({
      userId: portalUsers.id, name: portalUsers.name, employeeId: portalUsers.employeeId, role: portalUsers.role,
      resourceId: portalResources.id, resource: portalResources.data,
      deviceId: learningViews.deviceId, viewCount: count(),
      firstViewedAt: min(learningViews.openedAt), lastViewedAt: max(learningViews.openedAt),
    }).from(learningViews)
      .innerJoin(portalUsers, eq(learningViews.userId, portalUsers.id))
      .innerJoin(portalResources, eq(learningViews.resourceId, portalResources.id))
      .where(and(...conditions))
      .groupBy(portalUsers.id, portalUsers.name, portalUsers.employeeId, portalUsers.role, portalResources.id, portalResources.data, learningViews.deviceId)
      .orderBy(desc(max(learningViews.openedAt))),
    db.select().from(portalUsers).orderBy(asc(portalUsers.name)),
    db.select().from(portalResources),
  ]);
  const records = rows.map(row => ({
    userId: row.userId, name: row.name, employeeId: row.employeeId, role: row.role,
    resourceId: row.resourceId, title: String(row.resource.title), deviceId: row.deviceId,
    viewCount: row.viewCount,
    firstViewedAt: new Date(row.firstViewedAt!).toISOString(),
    lastViewedAt: new Date(row.lastViewedAt!).toISOString(),
    archived: Boolean(row.resource.archived),
  }));
  const modules = resources.filter(row => row.data.kind === "learning").map(row => ({
    id: row.id, title: String(row.data.title), archived: Boolean(row.data.archived),
  })).sort((a, b) => a.title.localeCompare(b.title));
  res.setHeader("Cache-Control", "no-store");
  res.json(GetViewingReportResponse.parse({ records, people, modules }));
});

export default router;
