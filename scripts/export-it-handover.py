"""Export the maintained IT specification without third-party dependencies."""
from pathlib import Path
import base64
import html
import re
import zipfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/warehouse-portal-it-handover.md"
OUT = ROOT / "generated-artifacts/it-handover"
OUT.mkdir(parents=True, exist_ok=True)
text = SOURCE.read_text()


def inline(value):
    value = html.escape(value)
    value = re.sub(r"`([^`]+)`", r"<code>\1</code>", value)
    return re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", value)


def plain(value):
    return re.sub(r"\*\*|`", "", value)


blocks = []
lines = text.splitlines()
i = 0
while i < len(lines):
    line = lines[i].strip()
    if not line:
        i += 1
        continue
    if line.startswith("|"):
        rows = []
        while i < len(lines) and lines[i].strip().startswith("|"):
            row = [x.strip() for x in lines[i].strip().strip("|").split("|")]
            if not all(re.fullmatch(r"[: -]+", cell) for cell in row):
                rows.append(row)
            i += 1
        blocks.append(("table", rows))
        continue
    match = re.match(r"^(#{1,3}) (.+)", line)
    if match:
        blocks.append(("h" + str(len(match[1])), match[2]))
    elif line.startswith("- "):
        blocks.append(("bullet", line[2:]))
    elif re.match(r"^\d+\. ", line):
        blocks.append(("number", line))
    else:
        paragraph = [line]
        while i + 1 < len(lines) and lines[i + 1].strip() and not re.match(
            r"^(#|\||- |\d+\. )", lines[i + 1].strip()
        ):
            i += 1
            paragraph.append(lines[i].strip())
        blocks.append(("p", " ".join(paragraph)))
    i += 1

# A standalone HTML edition, including the logo, styles, and navigation.
logo = ROOT / "artifacts/warehouse-portal/public/images/hit-brand/logo-blue.png"
logo_uri = "data:image/png;base64," + base64.b64encode(logo.read_bytes()).decode()
body = []
toc = []
heading_index = 0
for kind, value in blocks:
    if kind == "table":
        rows = []
        for index, row in enumerate(value):
            tag = "th" if index == 0 else "td"
            rows.append("<tr>" + "".join(f"<{tag}>{inline(cell)}</{tag}>" for cell in row) + "</tr>")
        body.append('<div class="table-wrap"><table><thead>' + rows[0] + "</thead><tbody>" + "".join(rows[1:]) + "</tbody></table></div>")
    elif kind.startswith("h"):
        heading_index += 1
        anchor = f"section-{heading_index}"
        body.append(f'<{kind} id="{anchor}">{inline(value)}</{kind}>')
        if kind == "h2" and re.match(r"\d+\.", value):
            toc.append(f'<a href="#{anchor}">{inline(value)}</a>')
    elif kind in ("bullet", "number"):
        prefix = "• " if kind == "bullet" else ""
        body.append(f'<p class="list-item">{prefix}{inline(value)}</p>')
    else:
        body.append(f"<p>{inline(value)}</p>")

css = """
*{box-sizing:border-box}body{margin:0;background:#eef3f7;color:#172b3a;font:15px/1.65 Arial,Helvetica,sans-serif}
header{max-width:1120px;margin:30px auto 0;padding:30px 44px;background:white;border-top:6px solid #0081c6;border-radius:10px 10px 0 0;display:flex;align-items:center;gap:28px}
header img{width:90px;height:auto}header strong{font-size:23px;display:block;color:#006a9f}.eyebrow{font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:#516779}
.tools{margin-left:auto}button{background:#006eaa;color:white;border:0;padding:12px 16px;border-radius:6px;font-weight:bold;cursor:pointer}
main{max-width:1120px;margin:0 auto 35px;background:#fff;padding:0 44px 44px}nav{padding:24px;border:1px solid #cbdce8;border-radius:8px;background:#f5faff;display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin-bottom:30px}nav strong{grid-column:1/-1}nav a{color:#006a9f;font-size:13px;text-decoration:none}
h1{font-size:38px;line-height:1.15;margin-top:0;padding-top:28px;color:#005f93}h2{font-size:24px;line-height:1.3;margin-top:38px;border-bottom:2px solid #dbe9f2;padding-bottom:10px;color:#006a9f}h3{font-size:18px;margin-top:26px;color:#243f51}
p{margin:10px 0}code{font:12px/1.5 Consolas,monospace;overflow-wrap:anywhere;background:#eef4f8;border-radius:3px;padding:1px 4px}.list-item{padding-left:14px;margin:7px 0}
table{width:100%;border-collapse:collapse;font-size:12px;line-height:1.5;margin:16px 0}th{background:#006d9f;color:white;text-align:left}td,th{padding:10px 12px;border:1px solid #cedce7;vertical-align:top;overflow-wrap:anywhere}tbody tr:nth-child(even){background:#f5f9fc}.table-wrap{overflow-x:auto}
footer{margin-top:35px;padding-top:18px;border-top:1px solid #dbe9f2;font-size:12px;color:#52697b}
@media(max-width:700px){header{margin:0;padding:22px;gap:16px;border-radius:0}header img{width:65px}header strong{font-size:18px}.tools{display:none}main{padding:0 22px 28px}nav{grid-template-columns:1fr;padding:16px}h1{font-size:30px}table{min-width:580px}}
@page{size:letter;margin:0.65in}
@media print{body{background:white;font-size:10pt;line-height:1.45}header{margin:0;padding:0 0 18px;border-top:0}header img{width:65px}main{padding:0;margin:0;max-width:none}.tools{display:none}nav{display:none}h1{font-size:28pt}h2{font-size:17pt;break-after:avoid}h3{font-size:12pt;break-after:avoid}.table-wrap{overflow:visible}table{font-size:8pt;min-width:0}th,td{padding:6px}thead{display:table-header-group}tr{break-inside:avoid}p{orphans:3;widows:3}code{font-size:8pt}}
"""
html_page = (
    '<!doctype html><html lang="en"><head><meta charset="utf-8">'
    '<meta name="viewport" content="width=device-width,initial-scale=1">'
    '<title>Warehouse Portal — IT handover</title><style>' + css + '</style></head><body>'
    '<header><img alt="Hit Promotional Products" src="' + logo_uri + '"><div><span class="eyebrow">Warehouse Portal</span>'
    '<strong>IT handover &amp; rebuild specification</strong></div><div class="tools"><button onclick="window.print()">Print / Save as PDF</button></div></header><main>'
    '<nav aria-label="Document contents"><strong>Document contents</strong>' + "".join(toc) + "</nav>"
    + "".join(body) + '<footer>Reference specification for IT’s rebuild. Prototype behaviors are distinguished from production decisions and provider-dependent requirements.</footer></main></body></html>'
)
(OUT / "warehouse-portal-it-handover.html").write_text(html_page)

# Standards-based editable Word document. Each XML part is validated before export.
W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"


def paragraph(value, style=None, size=None, color=None):
    props = f'<w:pStyle w:val="{style}"/>' if style else ""
    run_props = (f'<w:sz w:val="{size}"/>' if size else "") + (f'<w:color w:val="{color}"/>' if color else "")
    return (
        "<w:p><w:pPr>" + props + "</w:pPr><w:r><w:rPr>" + run_props
        + '</w:rPr><w:t xml:space="preserve">' + html.escape(plain(value)) + "</w:t></w:r></w:p>"
    )


word_body = []
for kind, value in blocks:
    if kind == "table":
        cols = len(value[0])
        widths = [3200] + [int((10540 - 3200) / (cols - 1))] * (cols - 1)
        rows = []
        for index, row in enumerate(value):
            cells = []
            for cell, width in zip(row, widths):
                shade = "006D9F" if index == 0 else ("F2F7FB" if index % 2 == 0 else "FFFFFF")
                content = paragraph(cell, size=17, color="FFFFFF" if index == 0 else "172B3A")
                cells.append(f'<w:tc><w:tcPr><w:tcW w:w="{width}" w:type="dxa"/><w:shd w:fill="{shade}"/></w:tcPr>{content}</w:tc>')
            row_props = '<w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>' if index == 0 else '<w:trPr><w:cantSplit/></w:trPr>'
            rows.append("<w:tr>" + row_props + "".join(cells) + "</w:tr>")
        grid = "".join(f'<w:gridCol w:w="{width}"/>' for width in widths)
        word_body.append('<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="10540" w:type="dxa"/><w:tblCellMar><w:top w:w="85" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="85" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>' + grid + "</w:tblGrid>" + "".join(rows) + "</w:tbl>")
        word_body.append(paragraph(""))
    else:
        styles = {"h1": "Title", "h2": "Heading1", "h3": "Heading2"}
        word_body.append(paragraph(("• " if kind == "bullet" else "") + value, styles.get(kind)))

document = (
    f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="{W}" xmlns:r="{R}"><w:body>'
    + "".join(word_body)
    + '<w:sectPr><w:footerReference w:type="default" r:id="rIdFooter"/><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="850" w:right="850" w:bottom="850" w:left="850" w:header="400" w:footer="400"/></w:sectPr></w:body></w:document>'
)
styles = f'''<?xml version="1.0" encoding="UTF-8"?>
<w:styles xmlns:w="{W}">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="21"/><w:color w:val="172B3A"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="130" w:line="270" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:styleId="Normal" w:default="1"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:pPr><w:keepNext/><w:spacing w:before="100" w:after="260"/></w:pPr><w:rPr><w:b/><w:sz w:val="46"/><w:color w:val="006D9F"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:keepNext/><w:spacing w:before="320" w:after="170"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="30"/><w:color w:val="006D9F"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:pPr><w:keepNext/><w:spacing w:before="210" w:after="120"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="25"/></w:rPr></w:style>
<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:color="CADAE5"/><w:left w:val="single" w:sz="4" w:color="CADAE5"/><w:bottom w:val="single" w:sz="4" w:color="CADAE5"/><w:right w:val="single" w:sz="4" w:color="CADAE5"/><w:insideH w:val="single" w:sz="4" w:color="CADAE5"/><w:insideV w:val="single" w:sz="4" w:color="CADAE5"/></w:tblBorders></w:tblPr></w:style>
</w:styles>'''
footer = f'<w:ftr xmlns:w="{W}"><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="16"/><w:color w:val="52697B"/></w:rPr><w:t>Warehouse Portal | IT handover | Page </w:t></w:r><w:fldSimple w:instr="PAGE"/></w:p></w:ftr>'
parts = {
    "[Content_Types].xml": '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>',
    "_rels/.rels": f'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="{R}/officeDocument" Target="word/document.xml"/></Relationships>',
    "word/document.xml": document,
    "word/styles.xml": styles,
    "word/footer1.xml": footer,
    "word/_rels/document.xml.rels": f'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="{R}/styles" Target="styles.xml"/><Relationship Id="rIdFooter" Type="{R}/footer" Target="footer1.xml"/></Relationships>',
}
for value in parts.values():
    ET.fromstring(value)
docx_path = OUT / "warehouse-portal-it-handover.docx"
with zipfile.ZipFile(docx_path, "w", zipfile.ZIP_DEFLATED) as archive:
    for name, value in parts.items():
        archive.writestr(name, value)
with zipfile.ZipFile(docx_path) as archive:
    assert archive.testzip() is None
    recovered = "".join(ET.fromstring(archive.read("word/document.xml")).itertext())
    assert all(plain(v) in recovered for k, v in blocks if k != "table")
    assert all(plain(cell) in recovered for k, v in blocks if k == "table" for row in v for cell in row)
assert html_page.count("<table>") == sum(k == "table" for k, v in blocks)
print(f"Exported and validated {len(blocks)} blocks, including {sum(k == 'table' for k, v in blocks)} tables.")
print(docx_path.relative_to(ROOT))
print((OUT / "warehouse-portal-it-handover.html").relative_to(ROOT))
