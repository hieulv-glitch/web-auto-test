import { readTestCases } from '../utils/google-sheets';

(async () => {
  const rows = await readTestCases('Biểu đồ');
  console.log(JSON.stringify(rows, null, 2));
})();
