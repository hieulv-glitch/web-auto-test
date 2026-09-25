import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import * as dotenv from 'dotenv';

dotenv.config();

export interface TestCaseRow {
  [column: string]: string;
}

/** Cột dùng làm "mỏ neo" để dò ra dòng header thật trong mỗi tab (bảng testcase có vài dòng info ở trên không đều nhau). */
const HEADER_ANCHOR_COLUMN_VALUE = 'TC ID';

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function loadSheet() {
  const jwt = new JWT({
    email: getEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
    key: getEnv('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY').replace(/\\n/g, '\n'),
    // loadCells (dùng để dò header) đòi hỏi scope đầy đủ, scope "readonly" bị Google trả 403.
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(getEnv('GOOGLE_SHEETS_SPREADSHEET_ID'), jwt);
  await doc.loadInfo();
  return doc;
}

/** Dò dòng header thật (chứa "TC ID") trong N dòng đầu, trả về row index 1-based cho loadHeaderRow(). */
async function findHeaderRowIndex(sheet: GoogleSpreadsheetWorksheet, maxScanRows = 30, maxScanCols = 6): Promise<number> {
  const scanRows = Math.min(maxScanRows, sheet.rowCount);
  const scanCols = Math.min(maxScanCols, sheet.columnCount);
  await sheet.loadCells({ startRowIndex: 0, endRowIndex: scanRows, startColumnIndex: 0, endColumnIndex: scanCols });

  for (let r = 0; r < scanRows; r++) {
    for (let c = 0; c < scanCols; c++) {
      const value = sheet.getCell(r, c).value;
      if (typeof value === 'string' && value.trim() === HEADER_ANCHOR_COLUMN_VALUE) {
        return r + 1;
      }
    }
  }
  throw new Error(`Không tìm thấy dòng header (cột "${HEADER_ANCHOR_COLUMN_VALUE}") trong ${scanRows} dòng đầu của tab "${sheet.title}"`);
}

/** Đọc toàn bộ testcase từ 1 tab, tự động dò dòng header, bỏ qua các dòng trống cuối bảng. */
export async function readTestCases(tabName = process.env.GOOGLE_SHEETS_TAB_NAME || 'Testcases'): Promise<TestCaseRow[]> {
  const doc = await loadSheet();
  const sheet = doc.sheetsByTitle[tabName];
  if (!sheet) {
    const available = Object.keys(doc.sheetsByTitle).join(', ');
    throw new Error(`Không tìm thấy tab "${tabName}". Các tab hiện có: ${available}`);
  }

  const headerRowIndex = await findHeaderRowIndex(sheet);
  await sheet.loadHeaderRow(headerRowIndex);

  const rows = await sheet.getRows();
  const anchorHeader = sheet.headerValues.find((h) => h === HEADER_ANCHOR_COLUMN_VALUE) ?? sheet.headerValues[0];

  return rows
    .map((row) => {
      const record: TestCaseRow = {};
      for (const header of sheet.headerValues) {
        record[header] = row.get(header) ?? '';
      }
      return record;
    })
    .filter((record) => (record[anchorHeader] ?? '').trim() !== '');
}

/** Liệt kê tên các tab (sheet) có trong spreadsheet — hữu ích để kiểm tra khi mới kết nối. */
export async function listSheetTabs(): Promise<string[]> {
  const doc = await loadSheet();
  return Object.keys(doc.sheetsByTitle);
}
