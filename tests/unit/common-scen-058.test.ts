import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssues } from '../../src/logic/issue-extraction-prioritization';
import { type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/types';

describe('issue-extraction-prioritization', () => {
  // SCEN-058: [normal] 日報集約から優先度別課題一覧提示までの自動判定・配信 AIエージェント
  test('should extract and rank issues from aggregated daily reports following autonomous action contract', async () => {
    // Setup: Test data with aggregated daily reports
    const aggregatedReports = [
      {
        report_id: 'report-001',
        member_name: 'Alice',
        yesterday_results: 'Fixed login page layout issue',
        today_plan: 'Implement user dashboard',
        issues: 'System障害が2時間続いた。在庫管理画面でバグ発生',
      },
      {
        report_id: 'report-002',
        member_name: 'Bob',
        yesterday_results: 'Completed API integration',
        today_plan: 'Write unit tests',
        issues: '対応遅延あり。品質問題が検出された',
      },
      {
        report_id: 'report-003',
        member_name: 'Charlie',
        yesterday_results: 'Database migration successful',
        today_plan: 'Performance optimization',
        issues: 'ネットワークタイムアウト。再発リスク高い',
      },
    ];

    // Setup: Stub AI client
    const stubAiClient: Tx3Imp1AiClient = {
      callAction01: jest.fn(async (prompt: string) => {
        // Simulate AI response with extracted keywords in structured format
        return {
          keywords: [
            { keyword: 'System障害', source_report_id: 'report-001', confidence: 0.95 },
            { keyword: '在庫管理画面バグ', source_report_id: 'report-001', confidence: 0.92 },
            { keyword: '対応遅延', source_report_id: 'report-002', confidence: 0.88 },
            { keyword: '品質問題', source_report_id: 'report-002', confidence: 0.90 },
            { keyword: 'ネットワークタイムアウト', source_report_id: 'report-003', confidence: 0.85 },
            { keyword: '再発リスク', source_report_id: 'report-003', confidence: 0.87 },
          ],
          prompt_version: 'ACTION_01_PROMPT_VERSION_1',
          call_count: 1,
        };
      }),
    };

    // Execute: Call the main function
    const result = await extractAndRankIssues(aggregatedReports, stubAiClient);

    // Verify: AI client was called exactly once
    expect(stubAiClient.callAction01).toHaveBeenCalledTimes(1);

    // Verify: Result structure
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    // Verify: Extracted keywords count within acceptable range (1-3 per report)
    const keyword_count = result.keywords.length;
    const expected_min = aggregatedReports.length * 1; // Minimum 1 per report
    const expected_max = aggregatedReports.length * 3; // Maximum 3 per report
    expect(keyword_count).toBeGreaterThanOrEqual(expected_min);
    expect(keyword_count).toBeLessThanOrEqual(expected_max);

    // Verify: All keywords correspond to source reports
    result.keywords.forEach((kw) => {
      expect(aggregatedReports.some((r) => r.report_id === kw.source_report_id)).toBe(true);
    });

    // Verify: All keywords exist in source report issue text
    result.keywords.forEach((kw) => {
      const sourceReport = aggregatedReports.find((r) => r.report_id === kw.source_report_id);
      expect(sourceReport).toBeDefined();
      expect(sourceReport!.issues).toContain(kw.keyword);
    });

    // Verify: Structured data format completeness
    result.keywords.forEach((kw) => {
      expect(typeof kw.keyword).toBe('string');
      expect(typeof kw.source_report_id).toBe('string');
      expect(typeof kw.confidence).toBe('number');
      expect(kw.confidence).toBeGreaterThan(0);
      expect(kw.confidence).toBeLessThanOrEqual(1);
    });

    // Verify: Prompt version recorded
    expect(result.prompt_version).toBe('ACTION_01_PROMPT_VERSION_1');

    // Verify: Specific extracted keywords exist
    const extracted_keywords = result.keywords.map((k) => k.keyword);
    expect(extracted_keywords).toContain('System障害');
    expect(extracted_keywords).toContain('在庫管理画面バグ');
    expect(extracted_keywords).toContain('対応遅延');
    expect(extracted_keywords).toContain('品質問題');
    expect(extracted_keywords).toContain('ネットワークタイムアウト');
    expect(extracted_keywords).toContain('再発リスク');

    // Verify: Total keyword count equals 6 (2 per report)
    expect(result.keywords.length).toBe(6);

    // Verify: Each report has keywords
    const report_001_keywords = result.keywords.filter((k) => k.source_report_id === 'report-001');
    const report_002_keywords = result.keywords.filter((k) => k.source_report_id === 'report-002');
    const report_003_keywords = result.keywords.filter((k) => k.source_report_id === 'report-003');

    expect(report_001_keywords.length).toBe(2);
    expect(report_002_keywords.length).toBe(2);
    expect(report_003_keywords.length).toBe(2);
  });
});