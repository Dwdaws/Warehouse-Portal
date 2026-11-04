import { Router, type IRouter, type Request, type Response } from "express";
import { randomBytes, randomUUID, randomInt } from "node:crypto";
import { eq, and, gt, inArray } from "drizzle-orm";
import { db, portalUsers, portalResources, portalSessions, portalCodes } from "@workspace/db";
import { SignInBody, SaveResourceBody, SaveResourceResponse, RegisterDeviceBody, RequestUploadUrlBody, GetSessionResponse, ListResourcesResponse } from "@workspace/api-zod";
import { ObjectStorageService } from "../lib/objectStorage";
import { makeMaster } from "../lib/portal-files";
import { DEMO_PROFILE_IDS } from "../lib/demo-profiles";

const router: IRouter = Router();
const storage = new ObjectStorageService();
type User = typeof portalUsers.$inferSelect;
const areas = ["Receiving", "Picking", "Packing", "Shipping", "Inventory", "Safety"];

async function currentUser(req: Request) {
  const token = req.headers.cookie?.split(";").map(x => x.trim()).find(x => x.startsWith("warehouse_demo="))?.split("=")[1];
  if (!token) return undefined;
  const [session] = await db.select().from(portalSessions).where(and(eq(portalSessions.id, token), gt(portalSessions.expiresAt, new Date())));
  if (!session) return undefined;
  const [user] = await db.select().from(portalUsers).where(eq(portalUsers.id, session.userId));
  return user;
}
function hasManagerAccess(user: User) {
  return user.role === "Manager" || user.jobLevel === "Supervisor";
}
export async function requireRole(req: Request, res: Response, role: "user" | "manager" | "editor") {
  const user = await currentUser(req);
  if (!user) { res.status(401).json({error:"Please sign in to the demo."}); return undefined; }
  if ((role === "manager" && !hasManagerAccess(user)) || (role === "editor" && !(user.role === "Manager" && user.editor))) {
    res.status(403).json({error:"You do not have permission for this action."}); return undefined;
  }
  return user;
}
export function canView(user: User, data: Record<string, unknown>) {
  if (data.archived && !user.editor) return false;
  if (!hasManagerAccess(user) && (data.kind === "toolkit" || data.audience === "Managers" || data.area === "Talent Management")) return false;
  return true;
}
async function sessionPayload(user?: User) {
  const demoProfiles = await db.select().from(portalUsers).where(inArray(portalUsers.id, DEMO_PROFILE_IDS));
  demoProfiles.sort((a, b) => DEMO_PROFILE_IDS.indexOf(a.id) - DEMO_PROFILE_IDS.indexOf(b.id));
  return GetSessionResponse.parse({user:user ?? null,demoProfiles});
}
router.get("/portal/session", async (req,res):Promise<void> => { res.json(await sessionPayload(await currentUser(req))); });
router.post("/portal/session", async (req,res):Promise<void> => {
  const parsed = SignInBody.safeParse(req.body);
  if (!parsed.success) {res.status(400).json({error:"Choose a demo profile or enter a device code."});return;}
  let user: User | undefined;
  if (parsed.data.userId) {
    [user] = await db.select().from(portalUsers).where(and(eq(portalUsers.id, parsed.data.userId),inArray(portalUsers.id,DEMO_PROFILE_IDS)));
  } else if (parsed.data.code) {
    // DELETE RETURNING atomically consumes a code: concurrent redemption cannot reuse it.
    const [code] = await db.delete(portalCodes).where(and(eq(portalCodes.id,parsed.data.code.trim().toUpperCase()),gt(portalCodes.expiresAt,new Date()))).returning();
    if (code) [user] = await db.select().from(portalUsers).where(eq(portalUsers.id,code.userId));
  }
  if (!user) {res.status(400).json({error:"Invalid or expired device code. Ask your manager for a new code."});return;}
  const token = randomBytes(32).toString("hex");
  await db.insert(portalSessions).values({id:token,userId:user.id,expiresAt:new Date(Date.now()+365*86400000)});
  res.cookie("warehouse_demo",token,{httpOnly:true,sameSite:"lax",secure:req.secure || req.headers["x-forwarded-proto"]==="https",path:"/",maxAge:365*86400000});
  res.json(await sessionPayload(user));
});
router.delete("/portal/session", async (req,res):Promise<void> => {
  const token = req.headers.cookie?.split(";").map(x=>x.trim()).find(x=>x.startsWith("warehouse_demo="))?.split("=")[1];
  if (token) await db.delete(portalSessions).where(eq(portalSessions.id,token));
  res.clearCookie("warehouse_demo",{path:"/"}).json({status:"signed out"});
});
router.get("/portal/resources", async (req,res):Promise<void> => {
  const user = await requireRole(req,res,"user");if(!user)return;
  const rows = await db.select().from(portalResources);
  res.json(ListResourcesResponse.parse(rows.map(x=>x.data).filter(data=>canView(user,data))));
});
router.post("/portal/resources", async (req,res):Promise<void> => {
  const user = await requireRole(req,res,"editor");if(!user)return;
  const parsed = SaveResourceBody.safeParse(req.body);
  if (!parsed.success) {res.status(400).json({error:parsed.error.message});return;}
  const input = parsed.data;
  if (input.shareUrl) {
    try {if(new URL(input.shareUrl).protocol !== "https:") throw new Error();} catch {res.status(400).json({error:"Enter a valid HTTPS share link."});return;}
  }
  if (input.fileUrl && !input.fileUrl.startsWith("/api/storage/objects/") && !input.fileUrl.startsWith("/api/portal/files/")) {
    res.status(400).json({error:"Upload the file using the file picker."});return;
  }
  const id = input.id || randomUUID();
  const [existing] = await db.select().from(portalResources).where(eq(portalResources.id,id));
  if (input.id && !existing) {res.status(404).json({error:"Resource not found."});return;}
  const now = new Date().toISOString();
  const data = {...existing?.data,...input,id,contentGroup:input.contentGroup?.trim() ?? existing?.data.contentGroup ?? "",createdAt:existing?.data.createdAt ?? now,updatedAt:now};
  if (input.kind === "toolkit" || input.area === "Talent Management") data.audience = "Managers";
  await db.insert(portalResources).values({id,data}).onConflictDoUpdate({target:portalResources.id,set:{data}});
  res.json(SaveResourceResponse.parse(data));
});
router.get("/portal/employees", async (req,res):Promise<void> => {
  if (!await requireRole(req,res,"manager")) return;
  res.json(await db.select().from(portalUsers).where(eq(portalUsers.role,"Employee")));
});
router.post("/portal/registrations", async (req,res):Promise<void> => {
  if (!await requireRole(req,res,"manager")) return;
  const parsed=RegisterDeviceBody.safeParse(req.body);
  if(!parsed.success){res.status(400).json({error:"Invalid registration details."});return;}
  const input=parsed.data;
  if(input.jobLevel==="Manager"){res.status(400).json({error:"Manager accounts use manager sign-in. Choose Frontline Employee, Lead, or Supervisor for employee device registration."});return;}
  let employee:User|undefined;
  if(input.employeeUserId) {
    [employee]=await db.select().from(portalUsers).where(and(eq(portalUsers.id,input.employeeUserId),eq(portalUsers.role,"Employee")));
  } else {
    if(!input.name?.trim() || !input.employeeId?.trim() || !areas.includes(input.area ?? "")){res.status(400).json({error:"Name, employee ID, and warehouse area are required."});return;}
    const [duplicate]=await db.select().from(portalUsers).where(eq(portalUsers.employeeId,input.employeeId.trim()));
    if(duplicate){res.status(409).json({error:"That employee ID already exists. Select the existing employee."});return;}
    [employee]=await db.insert(portalUsers).values({id:randomUUID(),name:input.name.trim(),employeeId:input.employeeId.trim(),area:input.area!,role:"Employee",jobLevel:input.jobLevel ?? "Frontline Employee",editor:false}).returning();
  }
  if(!employee){res.status(404).json({error:"Employee not found."});return;}
  if(input.jobLevel && employee.jobLevel!==input.jobLevel){
    [employee]=await db.update(portalUsers).set({jobLevel:input.jobLevel}).where(eq(portalUsers.id,employee.id)).returning();
  }
  const code=String(randomInt(100000,1000000));
  const expiresAt=new Date(Date.now()+15*60000);
  await db.delete(portalCodes).where(eq(portalCodes.userId,employee.id));
  await db.insert(portalCodes).values({id:code,userId:employee.id,expiresAt});
  res.json({code,expiresAt:expiresAt.toISOString(),employee});
});
router.post("/storage/uploads/request-url", async(req,res):Promise<void>=>{
  if(!await requireRole(req,res,"editor"))return;
  const parsed=RequestUploadUrlBody.safeParse(req.body);
  if(!parsed.success){res.status(400).json({error:"Choose a document up to 20 MB."});return;}
  if(!/\.(pdf|doc|docx|xls|xlsx)$/i.test(parsed.data.name)){res.status(400).json({error:"Only PDF, Word, and Excel documents are supported."});return;}
  const uploadURL=await storage.getObjectEntityUploadURL();
  res.json({uploadURL,objectPath:storage.normalizeObjectEntityPath(uploadURL)});
});
router.get("/storage/objects/{*path}",async(req,res):Promise<void>=>{
  const user=await requireRole(req,res,"user");if(!user)return;
  const objectPath=req.path.replace("/storage","");
  const resources=await db.select().from(portalResources);
  const item=resources.find(x=>x.data.fileUrl===`/api/storage${objectPath}` && !x.data.archived && canView(user,x.data));
  if(!item){res.status(404).json({error:"File not found."});return;}
  try {
    const file=await storage.getObjectEntityFile(objectPath);
    const [metadata]=await file.getMetadata();
    res.setHeader("Content-Type",String(metadata.contentType||"application/octet-stream"));
    const filename=String(item.data.fileName||"document").replace(/[^a-zA-Z0-9._ -]/g,"_");
    res.setHeader("Content-Disposition",`${req.query.download?"attachment":"inline"}; filename="${filename}"`);
    res.setHeader("Cache-Control","private, no-cache");
    file.createReadStream().on("error",err=>{req.log.error({err},"File stream failed");if(!res.headersSent)res.status(500).end();else res.destroy();}).pipe(res);
  } catch(err) {req.log.warn({err},"File unavailable");res.status(404).json({error:"File is unavailable."});}
});
router.get("/portal/files/:id",async(req,res):Promise<void>=>{
  const user=await requireRole(req,res,"user");if(!user)return;
  const [row]=await db.select().from(portalResources).where(eq(portalResources.id,String(req.params.id)));
  if(!row || row.data.archived || !canView(user,row.data)){res.status(404).json({error:"File not found."});return;}
  const file=await makeMaster(row.data);
  res.type(file.type);
  const filename=String(row.data.fileName||"master.pdf").replace(/[^a-zA-Z0-9._ -]/g,"_");
  res.setHeader("Content-Disposition",`${req.query.download?"attachment":"inline"}; filename="${filename}"`);
  res.send(file.bytes);
});
export default router;
