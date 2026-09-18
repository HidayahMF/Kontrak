import XLSX from 'xlsx';
import { getPool } from '../config/database';
import { authConfig, quoteIdentifier } from '../config/auth';
import { create } from './contractService';

type ImportRow = { nip: string; employeeName?: string; department?: string; startDate: string; endDate: string; contractNumber?: string };

const text = (value: unknown) => String(value ?? '').trim();
const normalize = (value: unknown) => text(value).toLowerCase().replace(/[\s_/-]+/g, '');
const dateLike = (value: unknown) => Boolean(date(value));
const romanMonths = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const contractNumber = (value: unknown, startDate: string) => {
  const raw = text(value);
  if (!raw || raw === '-') return undefined;
  if (/^\d{1,3}\/[^/]+\/[^/]+\/[IVXLCDM]+\/\d{4}$/i.test(raw)) return raw;
  if (!/^\d{1,4}$/.test(raw) || !startDate) return dateLike(raw) ? undefined : raw;
  const month = Number(startDate.slice(5, 7));
  const year = startDate.slice(0, 4);
  return `${raw.padStart(3, '0')}/HC/BMC/${romanMonths[month]}/${year}`;
};
const date = (value: unknown): string => {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const valueText = text(value);
  if (/^\d+(\.\d+)?$/.test(valueText)) {
    const serial = Number(valueText);
    if (serial > 20000 && serial < 80000) {
      const excelDate = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
      return excelDate.toISOString().slice(0, 10);
    }
  }
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(valueText)) { const [y, m, d] = valueText.split('-'); return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`; }
  const match = valueText.match(/^(\d{1,2})[-/ ]([A-Za-z]+|\d{1,2})[-/ ](\d{2,4})$/);
  if (!match) return '';
  const months: Record<string, number> = { jan: 1, januari: 1, january: 1, feb: 2, februari: 2, february: 2, mar: 3, maret: 3, march: 3, apr: 4, april: 4, may: 5, mei: 5, jun: 6, juni: 6, june: 6, jul: 7, juli: 7, july: 7, aug: 8, agustus: 8, august: 8, sep: 9, september: 9, oct: 10, oktober: 10, october: 10, nov: 11, november: 11, dec: 12, desember: 12, december: 12 };
  const month = Number.isNaN(Number(match[2])) ? months[match[2].toLowerCase()] : Number(match[2]);
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return month ? `${year}-${String(month).padStart(2, '0')}-${match[1].padStart(2, '0')}` : '';
};

export async function importWorkbook(buffer: Buffer, by: string) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, raw: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: false });
  if (!rows.length) throw Object.assign(new Error('File Excel kosong.'), { status: 400 });
  const headerNames = ['nip', 'nama', 'namakaryawan', 'departemen', 'nomorkontrak', 'tanggalawal', 'awalkontrak', 'awalcontrak', 'awalcontract', 'tanggalakhir', 'akhirkontrak'];
  const headerRow = rows.slice(0, 10).findIndex(row => (row as unknown[]).map(normalize).filter(value => headerNames.includes(value)).length >= 2);
  const hasHeader = headerRow >= 0;
  const header = hasHeader ? (rows[headerRow] as unknown[]).map(normalize) : ['nip', 'nama', 'departemen', 'unused', 'startDate', 'endDate', 'contractNumber'];
  const index = (names: string[], fallback: number) => { const found = names.map(normalize).map(name => header.indexOf(name)).find(value => value >= 0); return found ?? fallback; };
  const nipIndex = index(['nip', 'nik'], 0), nameIndex = index(['nama', 'namakaryawan', 'name'], 1), departmentIndex = index(['departemen', 'department', 'unitkerja'], 2), startIndex = index(['tanggalawal', 'awalkontrak', 'awalcontrak', 'awalcontract', 'startdate', 'tanggalmulai', 'mulai'], 4), endIndex = index(['tanggalakhir', 'akhirkontrak', 'akhircontrak', 'akhircontract', 'enddate', 'tanggalselesai', 'selesai'], 5), numberIndex = index(['nomorkontrak', 'contractnumber', 'nomor', 'nokontrak'], 6);
  const results: { row: number; nip?: string; success: boolean; skipped?: boolean; message: string }[] = [];
  let previous: Partial<ImportRow> = {};
  for (let i = hasHeader ? headerRow + 1 : 0; i < rows.length; i += 1) {
    const row = rows[i] as unknown[]; const rawNip = text(row[nipIndex]); const rawName = text(row[nameIndex]); const rawDepartment = text(row[departmentIndex]); const rawNumber = text(row[numberIndex]);
    if (!rawNip && !rawName && !rawDepartment && !rawNumber && row.every(value => !text(value))) continue;
    let startDate = date(row[startIndex]), endDate = date(row[endIndex]);
    if (!startDate || !endDate) { const dateCells = row.map(date).filter(Boolean); startDate ||= dateCells[0] ?? ''; endDate ||= dateCells[1] ?? ''; }
    const resolvedStart = startDate || previous.startDate || '';
    const resolvedEnd = endDate || previous.endDate || '';
    const numberCandidates = [row[numberIndex], ...row].filter(value => !dateLike(value));
    const rawContractNumber = numberCandidates.find(value => /^\d{1,4}$/.test(text(value)) || /^\d{1,3}\/[^/]+\/[^/]+\/[IVXLCDM]+\/\d{4}$/i.test(text(value)));
    const input: ImportRow = { nip: rawNip || previous.nip || '', employeeName: rawName || previous.employeeName, department: rawDepartment || previous.department, startDate: resolvedStart, endDate: resolvedEnd, contractNumber: contractNumber(rawContractNumber, resolvedStart) };
    if (input.nip && input.startDate && input.endDate) previous = { nip: input.nip, employeeName: input.employeeName, department: input.department, startDate: input.startDate, endDate: input.endDate };
    if (!input.contractNumber && (!input.nip || !input.startDate || !input.endDate)) continue;
    try { if (!input.nip || !input.startDate || !input.endDate) throw new Error('NIP dan tanggal kontrak tidak tersedia; isi baris utama atau letakkan nomor kontrak di bawah baris utama.'); await create(input, by, { allowInactive: true, allowMissingHris: true }); results.push({ row: i + 1, nip: input.nip, success: true, message: 'Berhasil diimport.' }); }
    catch (error) { const duplicate = error instanceof Error && 'code' in error && (error as Error & { code?: unknown }).code === 'DUPLICATE'; results.push({ row: i + 1, nip: input.nip, success: false, skipped: duplicate, message: error instanceof Error ? error.message : 'Baris gagal diimport.' }); }
  }
  return { total: results.length, imported: results.filter(item => item.success).length, skipped: results.filter(item => item.skipped).length, failed: results.filter(item => !item.success && !item.skipped).length, results };
}

export async function exportWorkbook() {
  const table = 'dbo.EmployeeContracts';
  const result = await (await getPool()).request().query(`SELECT c.NIP AS NIP,c.EmployeeNameSnapshot AS NamaKaryawan,c.DepartmentSnapshot AS Departemen,c.ContractNumber AS NomorKontrak,c.ContractStartDate AS AwalKontrak,c.ContractEndDate AS AkhirKontrak,cr.${quoteIdentifier(authConfig.hrisNameColumn)} AS DiinputOleh FROM ${table} c LEFT JOIN ${quoteIdentifier(authConfig.hrisTable)} cr ON cr.${quoteIdentifier(authConfig.hrisNipColumn)}=c.CreatedByNIP ORDER BY c.ContractStartDate DESC,c.Id DESC`);
  const rows = result.recordset.map((row: any) => ({ NIP: text(row.NIP), NamaKaryawan: text(row.NamaKaryawan), Departemen: text(row.Departemen), NomorKontrak: text(row.NomorKontrak), AwalKontrak: row.AwalKontrak, AkhirKontrak: row.AkhirKontrak, DiinputOleh: text(row.DiinputOleh) }));
  const sheet = XLSX.utils.json_to_sheet(rows); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, sheet, 'Laporan Kontrak');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
