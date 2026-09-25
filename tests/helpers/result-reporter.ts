import fs from 'fs';
import path from 'path';
import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';

export default class ResultReporter implements Reporter {
  private testResults = new Map<string, string>();

  onTestEnd(test: TestCase, result: TestResult) {
    const prev = this.testResults.get(test.title);
    const wasFailed = prev?.includes('❌');
    let icon = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⏭️';
    let label = result.status.toUpperCase();
    // Nếu lần trước fail, lần này pass (nhờ retry) => đánh dấu SLOW thay vì PASSED trơn
    if (wasFailed && result.status === 'passed') {
      icon = '⚠️';
      label = 'SLOW';
    }
    this.testResults.set(test.title, `${icon} ${label}: ${test.title} (${(result.duration / 1000).toFixed(1)}s)`);
  }

  onEnd(result: FullResult) {
    const results = [...this.testResults.values()];
    const total = results.length;
    const passed = results.filter((r) => r.includes('✅')).length;
    const failed = results.filter((r) => r.includes('❌')).length;
    const skipped = total - passed - failed;

    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const jobName = process.env.CI_JOB_NAME || 'local';
    const header = `Web Auto Test Report [${jobName}]\n${timestamp}\n${passed}/${total} passed | ${failed} failed | ${skipped} skipped\n${(result.duration / 1000).toFixed(1)}s total\n${'─'.repeat(40)}`;
    const fullMessage = [header, ...results].join('\n');

    const dir = path.join(process.cwd(), 'result_file');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const fileName = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}_${now.getHours()}h.txt`;
    fs.writeFileSync(path.join(dir, fileName), fullMessage, 'utf8');
  }
}
