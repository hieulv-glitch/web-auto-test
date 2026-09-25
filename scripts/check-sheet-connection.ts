import { listSheetTabs, readTestCases } from '../utils/google-sheets';

async function main() {
  console.log('Đang kết nối Google Sheet...');
  const tabs = await listSheetTabs();
  console.log('Kết nối thành công. Các tab tìm thấy:', tabs);

  const tabName = process.env.GOOGLE_SHEETS_TAB_NAME;
  if (tabName && tabs.includes(tabName)) {
    const rows = await readTestCases(tabName);
    console.log(`Đọc được ${rows.length} dòng từ tab "${tabName}". 3 dòng đầu:`);
    console.log(rows.slice(0, 3));
  }
}

main().catch((err) => {
  console.error('Kết nối thất bại:', err.message);
  process.exit(1);
});
