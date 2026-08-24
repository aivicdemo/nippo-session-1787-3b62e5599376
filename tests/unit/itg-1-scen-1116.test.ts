import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Duplicate Detection', () => {
  // SCEN-1116: [normal] 抽出課題データの重複検出機能 - 同一キーワードが複数の日報に出現した場合、重複として判定される
  test('should detect duplicate keywords across multiple reports and mark with duplicate flag', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn()
        .mockResolvedValueOnce({
          keywords: ['データベース接続エラー', '接続タイムアウト'],
          frequency: { 'データベース接続エラー': 1, '接続タイムアウト': 1 }
        })
        .mockResolvedValueOnce({
          keywords: ['データベース接続エラー', 'ネットワーク遅延'],
          frequency: { 'データベース接続エラー': 1, 'ネットワーク遅延': 1 }
        }),
      assessImpactScore: jest.fn().mockResolvedValue(45),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium')
    };

    const report1 = {
      reportId: 'report-001',
      teamId: 'team-a',
      date: new Date('2024-01-15T09:00:00Z'),
      content: 'データベース接続エラーが発生した。接続タイムアウトで処理が中断。'
    };

    const report2 = {
      reportId: 'report-002',
      teamId: 'team-a',
      date: new Date('2024-01-16T09:00:00Z'),
      content: '昨日に続きデータベース接続エラーが発生。ネットワーク遅延の影響か。'
    };

    const input = {
      teamId: 'team-a',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-16T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-123',
      reports: [report1, report2],
      textAnalysisAdapter: mockTextAnalysisAdapter
    };

    const result = await extractAndRankIssueKeywords(input);

    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    const duplicateKeywordEntry = result.keywords.find(
      (kw: any) => kw.keyword === 'データベース接続エラー' && kw.isDuplicate === true
    );

    expect(duplicateKeywordEntry).toBeDefined();
    expect(duplicateKeywordEntry.keyword).toBe('データベース接続エラー');
    expect(duplicateKeywordEntry.isDuplicate).toBe(true);
    expect(duplicateKeywordEntry.frequency).toBe(2);
    expect(duplicateKeywordEntry.firstReportId).toBe('report-001');
    expect(duplicateKeywordEntry.duplicateReportIds).toContain('report-002');

    const detectionLog = result.deduplicationLog?.find(
      (log: any) => log.duplicateKeyword === 'データベース接続エラー'
    );

    expect(detectionLog).toBeDefined();
    expect(detectionLog.duplicateKeyword).toBe('データベース接続エラー');
    expect(detectionLog.initialReportId).toBe('report-001');
    expect(detectionLog.detectedReportId).toBe('report-002');
    expect(detectionLog.detectedAt).toBeDefined();

    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(2);
    expect(result.analysisperiodDays).toBe(2);
    expect(result.extractedAt).toBeDefined();
  });
});