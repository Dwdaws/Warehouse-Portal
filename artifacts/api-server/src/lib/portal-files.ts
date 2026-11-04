import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Document, Packer, Paragraph, HeadingLevel } from "docx";
import ExcelJS from "exceljs";

export async function makeMaster(item: Record<string, unknown>) {
  const title = String(item.title);
  const description = String(item.description);
  if (item.kind === "sop") {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    page.drawText("WAREHOUSE PORTAL / DEMONSTRATION SOP", { x: 48, y: 742, size: 11, font: bold, color: rgb(.12,.4,.32) });
    page.drawText(title, { x: 48, y: 698, size: 21, font: bold });
    const lines = [
      `Area: ${item.area}  |  Version: ${item.version}`,
      `Owner: ${item.owner}`,
      `Effective: ${item.effectiveDate}  |  Last reviewed: ${item.lastReviewed}`,
      "",
      ...description.match(/.{1,76}(?:\s|$)/g) ?? [description],
      "",
      "1. Confirm the work area is safe and the correct order is available.",
      "2. Check product SKU, color, imprint, quantity, and condition.",
      "3. Follow the approved workstation instructions.",
      "4. Record discrepancies and notify the shift lead.",
      "5. Complete the handoff and leave the workstation ready for the next task.",
      "",
      "DEMO CONTENT - Not an approved operational procedure.",
      "Replace this sample with your company-approved master before actual use.",
    ];
    lines.forEach((text, i) => page.drawText(text.trim(), { x: 48, y: 656 - i * 22, size: 11, font }));
    return { bytes: Buffer.from(await doc.save()), type: "application/pdf" };
  }
  if (String(item.fileName).endsWith(".xlsx")) {
    const book = new ExcelJS.Workbook();
    const sheet = book.addWorksheet("Assessment");
    sheet.columns = [{width:32},{width:35},{width:35}];
    sheet.addRows([[title],["Blank master / demo"],["Employee name","",""],["Employee ID","",""],["Manager","",""],["Assessment date","",""],[],["Competency","Rating (1-5)","Evidence / comments"],["Safety practices"],["Quality and accuracy"],["Attendance and reliability"],["Teamwork"],["Independent task completion"],[],["Strengths"],["Development areas"],["Goals and due dates"],["Employee signature"],["Manager signature"]]);
    sheet.getRow(1).font = {bold:true,size:18};
    sheet.getRow(8).font = {bold:true};
    return {bytes:Buffer.from(await book.xlsx.writeBuffer()),type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"};
  }
  const doc = new Document({ sections: [{ children: [
    new Paragraph({text:title,heading:HeadingLevel.HEADING_1}),
    ...["Blank master / demonstration template",description,"Date: ____________________","Manager: ____________________","Employee / team: ____________________","Check-in and wins","","Discussion topics","","Feedback and support needed","","Goals and development","","Action items, owners, and due dates","","Next meeting: ____________________"].map(text => new Paragraph(text)),
  ] }] });
  return {bytes:await Packer.toBuffer(doc),type:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"};
}
