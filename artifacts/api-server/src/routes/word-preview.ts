import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, portalResources } from "@workspace/db";
import { GetWordPreviewParams, GetWordPreviewResponse } from "@workspace/api-zod";
import { requireRole, canView } from "./portal";
import { ObjectStorageService } from "../lib/objectStorage";
import { makeMaster } from "../lib/portal-files";
import { previewWord } from "../lib/word-preview";

const router: IRouter = Router();
const storage = new ObjectStorageService();
const MAX_BYTES = 20 * 1024 * 1024;

router.get("/portal/resources/:id/word-preview", async (req, res): Promise<void> => {
  const user = await requireRole(req, res, "user");
  if (!user) return;
  const params = GetWordPreviewParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid document." }); return; }
  const [row] = await db.select().from(portalResources).where(eq(portalResources.id, params.data.id));
  if (!row || row.data.archived || !canView(user, row.data)) {
    res.status(404).json({ error: "Document not found." }); return;
  }
  const filename = String(row.data.fileName || "");
  const format = /\.docx$/i.test(filename) ? "docx" : /\.doc$/i.test(filename) ? "doc" : null;
  if (!format) { res.status(415).json({ error: "This preview supports Word documents only." }); return; }
  try {
    const path = String(row.data.fileUrl || "");
    let buffer: Buffer;
    if (path.startsWith("/api/storage/objects/")) {
      const file = await storage.getObjectEntityFile(path.slice("/api/storage".length));
      const [metadata] = await file.getMetadata();
      if (Number(metadata.size) > MAX_BYTES) { res.status(413).json({ error: "This document is too large to preview." }); return; }
      [buffer] = await file.download();
    } else if (path === `/api/portal/files/${row.id}`) {
      buffer = (await makeMaster(row.data)).bytes;
    } else {
      res.status(404).json({ error: "No stored document is available." }); return;
    }
    if (buffer.length > MAX_BYTES) { res.status(413).json({ error: "This document is too large to preview." }); return; }
    const html = await previewWord(buffer, format);
    res.setHeader("Cache-Control", "private, no-store");
    res.json(GetWordPreviewResponse.parse({ html, format }));
  } catch (err) {
    req.log.warn({ err, resourceId: row.id }, "Word preview unavailable");
    res.status(422).json({ error: "This Word document could not be previewed. Download the original, or ask an editor to upload a PDF copy." });
  }
});

export default router;
