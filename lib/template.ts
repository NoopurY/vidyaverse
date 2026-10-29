/** Builds the Excel upload template: Students sheet (with dropdown validations), Instructions and Programs sheets. */
import * as XLSX from "xlsx";
import { TEMPLATE_COLUMNS, type StudentRow } from "./validation/schema";

const colLetter = (i: number) => XLSX.utils.encode_col(i);

export function buildTemplate(programs: { id: string; name: string }[], rows: Partial<StudentRow>[] = []) {
  const wb = XLSX.utils.book_new();
  const header = TEMPLATE_COLUMNS.map((c) => c.header);
  const body = rows.length ? rows.map((r) => TEMPLATE_COLUMNS.map((c) => r[c.key] ?? "")) : [TEMPLATE_COLUMNS.map((c) => c.example)];
  const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
  ws["!cols"] = TEMPLATE_COLUMNS.map((c) => ({ wch: Math.max(14, c.header.length + 4) }));
  // APAAR and mobile stored as text so Excel never turns them into scientific notation
  for (let r = 1; r <= body.length; r++) {
    for (const key of ["apaarId", "phone"]) {
      const ci = TEMPLATE_COLUMNS.findIndex((c) => c.key === key);
      const ref = `${colLetter(ci)}${r + 1}`;
      if (ws[ref]) ws[ref] = { t: "s", v: String(ws[ref].v), z: "@" };
    }
  }
  XLSX.utils.book_append_sheet(wb, ws, "Students");

  const help = XLSX.utils.aoa_to_sheet([
    ["Column", "Required", "Description", "Allowed values", "Example"],
    ...TEMPLATE_COLUMNS.map((c) => [c.header, c.required ? "Yes" : "No", c.description, c.options?.join(", ") ?? "", c.example]),
    [],
    ["Tips"],
    ["• Keep the header row unchanged. Format APAAR ID and Mobile columns as Text."],
    ["• Dates must be YYYY-MM-DD. Admission date must fall within the academic year (June–May)."],
    ["• NRI / OCI / Foreign National: only one can be Y. FN and OCI students use supernumerary seats."],
    ["• Never enter Aadhaar numbers. APAAR ID is the only identifier needed."],
  ]);
  help["!cols"] = [{ wch: 24 }, { wch: 10 }, { wch: 70 }, { wch: 40 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, help, "Instructions");

  if (programs.length) {
    const ps = XLSX.utils.aoa_to_sheet([["Program ID", "Program name"], ...programs.map((p) => [p.id, p.name])]);
    ps["!cols"] = [{ wch: 12 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, ps, "Programs");
  }
  return wb;
}

/**
 * Writes the workbook and injects <dataValidations> (dropdown lists) into the Students sheet XML.
 * SheetJS community edition does not emit data validations, so we patch the zip with its bundled CFB.
 */
export function templateBuffer(programs: { id: string; name: string }[], rows: Partial<StudentRow>[] = []): Buffer {
  const wb = buildTemplate(programs, rows);
  const raw = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const lists = TEMPLATE_COLUMNS.map((c, i) => ({ c, i }))
    .filter(({ c }) => c.options || (c.key === "programId" && programs.length))
    .map(({ c, i }) => ({ sqref: `${colLetter(i)}2:${colLetter(i)}2000`, values: c.key === "programId" ? programs.map((p) => p.id) : c.options! }));
  const xml =
    `<dataValidations count="${lists.length}">` +
    lists
      .map(
        (l) =>
          `<dataValidation type="list" allowBlank="1" showInputMessage="1" showErrorMessage="1" errorTitle="Invalid value" error="Pick a value from the list" sqref="${l.sqref}"><formula1>"${l.values.join(",")}"</formula1></dataValidation>`
      )
      .join("") +
    `</dataValidations>`;
  const cfb = XLSX.CFB.read(raw, { type: "buffer" });
<<<<<<< HEAD
  // CFB paths are rooted ("/xl/..."); without the leading slash find() silently returns null
  const entry = XLSX.CFB.find(cfb, "/xl/worksheets/sheet1.xml");
  if (!entry?.content) throw new Error("Template sheet not found while adding dropdowns");
=======
  const entry = XLSX.CFB.find(cfb, "xl/worksheets/sheet1.xml");
  if (!entry?.content) return raw;
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
  const sheetXml = Buffer.from(entry.content as Uint8Array).toString("utf8").replace("</sheetData>", `</sheetData>${xml}`);
  entry.content = Buffer.from(sheetXml, "utf8");
  entry.size = (entry.content as Buffer).length;
  return Buffer.from(XLSX.CFB.write(cfb, { fileType: "zip", type: "buffer" }) as Uint8Array);
}
