import { db, portalUsers, portalResources } from "@workspace/db";

export async function seedPortal() {
  await db.insert(portalUsers).values([
    { id: "m1", name: "Alex Morgan", employeeId: "M001", area: "Shipping", role: "Manager", editor: true },
    { id: "m2", name: "Jordan Lee", employeeId: "M002", area: "Receiving", role: "Manager", editor: false },
    { id: "e1", name: "Sam Rivera", employeeId: "WH1042", area: "Packing", role: "Employee", editor: false },
    { id: "e2", name: "Taylor Brooks", employeeId: "WH1058", area: "Picking", role: "Employee", editor: false },
  ]).onConflictDoNothing();
  const now = new Date();
  const sops = [
    ["receiving-check", "Receiving incoming shipments", "Receiving", "Check inbound promotional products against the purchase order, inspect cartons, and record discrepancies.", "3.1"],
    ["pick-accuracy", "Accurate order picking", "Picking", "Verify SKU, imprint, color, and quantity before moving an order to packing.", "2.0"],
    ["pack-standard", "Packing & quality check", "Packing", "Protect branded merchandise and verify each order before sealing the carton.", "4.2"],
    ["shipping-labels", "Shipping labels & dispatch", "Shipping", "Create accurate labels, validate the destination, and complete carrier handoff.", "2.3"],
    ["cycle-count", "Inventory cycle counts", "Inventory", "Count assigned locations and report stock discrepancies without interrupting fulfillment.", "1.4"],
    ["floor-safety", "Warehouse floor safety", "Safety", "Everyday guidance for safe walkways, lifting, and personal protective equipment.", "3.0"],
    ["damaged-stock", "Handling damaged stock", "Receiving", "Quarantine damaged products and notify the receiving lead before updating inventory.", "1.2"],
    ["lift-safety", "Safe lifting & manual handling", "Safety", "Assess the load, use assistance when needed, and follow safe handling procedures.", "2.1"],
  ];
  const items: Record<string, unknown>[] = sops.map(([id,title,area,description,version], i) => ({
    id, kind: "sop", title, description, area, version, audience: "Both", owner: ["Operations Team", "Quality Assurance", "Warehouse Safety"][i % 3],
    effectiveDate: "2026-09-01", lastReviewed: i === 6 ? "2025-04-15" : "2026-09-20",
    fileUrl: `/api/portal/files/${id}`, fileName: `${id}.pdf`, archived: false,
    createdAt: new Date(now.getTime() - i * 86400000).toISOString(), updatedAt: new Date(now.getTime() - i * 86400000).toISOString(),
  }));
  for (const [id,title,area,description,minutes,audience] of [
    ["learning-1", "Your first day on the floor", "Safety", "Get familiar with your workspace, your team, and the essentials for a safe first shift.", 8, "Both"],
    ["learning-2", "The perfect pack", "Packing", "Small details make a big difference. Learn how to protect every order.", 6, "Employees"],
    ["learning-3", "Leading a great shift", "Shipping", "Set expectations, run a clear shift briefing, and support your team.", 12, "Managers"],
    ["learning-4", "Picking with confidence", "Picking", "Build accuracy into every pick, from SKU verification to handoff.", 5, "Both"],
  ] as const) items.push({id,kind:"learning",title,area,description,minutes,audience,shareUrl:"",archived:false,createdAt:now.toISOString(),updatedAt:now.toISOString()});
  for (const [id,title,description,category,ext] of [
    ["one-on-one","1-on-1 meeting template","A practical framework for meaningful check-ins, feedback, and development.","Meeting Templates","docx"],
    ["team-meeting","Team meeting template","Keep your team aligned with a structured agenda and clear action items.","Meeting Templates","docx"],
    ["assessment-30","30-day assessment","Review onboarding progress and establish clear next steps.","30-60-90 Assessments","xlsx"],
    ["assessment-60","60-day assessment","Assess growing confidence, accuracy, and independence.","30-60-90 Assessments","xlsx"],
    ["assessment-90","90-day assessment","Evaluate readiness, reflect on progress, and set future goals.","30-60-90 Assessments","xlsx"],
  ]) items.push({id,kind:"toolkit",title,description,area:"Inventory",audience:"Managers",category,fileUrl:`/api/portal/files/${id}`,fileName:`${id}.${ext}`,archived:false,createdAt:now.toISOString(),updatedAt:now.toISOString()});
  const sampleGroups: Record<string, string> = {
    "receiving-check": "Inbound", "damaged-stock": "Inbound",
    "pick-accuracy": "Orders and Transfers", "pack-standard": "Distribution Outbound",
    "shipping-labels": "Distribution Outbound", "cycle-count": "Inventory Accuracy",
    "floor-safety": "System How-Tos and References", "lift-safety": "Putaway and Storage",
    "learning-1": "System How-Tos and References", "learning-2": "Distribution Outbound",
    "learning-3": "Distribution Outbound", "learning-4": "Orders and Transfers",
  };
  for (const item of items) {
    item.contentGroup = sampleGroups[String(item.id)] || "";
    if (item.kind === "toolkit") item.area = "Talent Management";
  }
  await db.insert(portalResources).values(items.map(data => ({ id: String(data.id), data }))).onConflictDoNothing();
}
