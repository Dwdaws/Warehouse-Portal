import mammoth from "mammoth";
import sanitizeHtml from "sanitize-html";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const execFileAsync = promisify(execFile);

export async function previewWord(buffer: Buffer, format: "doc" | "docx"): Promise<string> {
  if (format === "doc") {
    const dir = await mkdtemp(join(tmpdir(), "warehouse-word-"));
    try {
      const file = join(dir, "preview.doc");
      await writeFile(file, buffer, { mode: 0o600 });
      const { stdout } = await execFileAsync("antiword", ["-m", "UTF-8.txt", file], {
        timeout: 15000, maxBuffer: 8 * 1024 * 1024, encoding: "utf8",
      });
      if (!stdout.trim()) throw new Error("No readable text found.");
      // Old binary Word files get an explicitly labeled text-only preview.
      return `<pre>${sanitizeHtml(stdout, { allowedTags: [], allowedAttributes: {} })}</pre>`;
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
  const result = await mammoth.convertToHtml({ buffer }, {
    externalFileAccess: false,
    convertImage: mammoth.images.imgElement(async image => {
      // Only embed raster images from the document; do not contact outside services.
      if (!/^image\/(png|jpeg|gif|webp)$/i.test(image.contentType)) return { src: "" };
      return { src: `data:${image.contentType};base64,${await image.read("base64")}` };
    }),
  });
  const html = sanitizeHtml(result.value, {
    allowedTags: [
      "p", "br", "h1", "h2", "h3", "h4", "h5", "h6", "strong", "em", "b", "i",
      "u", "s", "strike", "sup", "sub", "ul", "ol", "li", "blockquote", "pre",
      "table", "thead", "tbody", "tfoot", "tr", "td", "th", "caption", "img", "hr",
    ],
    allowedAttributes: { img: ["src", "alt"], td: ["colspan", "rowspan"], th: ["colspan", "rowspan"] },
    allowedSchemes: ["data"],
    allowedSchemesByTag: { img: ["data"] },
    transformTags: {
      img: (_tag, attributes) => ({
        tagName: "img",
        attribs: /^data:image\/(png|jpeg|gif|webp);base64,/i.test(attributes.src ?? "") ? attributes : { alt: attributes.alt || "Image unavailable in preview" },
      }),
    },
  });
  if (!html.trim()) throw new Error("No readable content found.");
  return html;
}
