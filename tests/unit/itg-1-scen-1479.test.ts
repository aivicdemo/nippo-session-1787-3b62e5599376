import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-1479
  test('前週7日間の日報1件から課題キーワードが抽出され頻度1でランク付けされる', async () => {
    // Arrange
    const baseDate = new Date('2024-01-15T09:00:00Z');
    const startDate = new Date('2024-01-08T00:00:00Z'); // 前週月曜
    const endDate = new Date('2024-01-14T23:59:59Z'); // 前週日曜

    const teamId = 'team-001';
    const requestUserId = 'user-admin-001';
    const minFrequencyThreshold = 1;

    const mockReportData = [
      {
        reportId: 'report-20240114-001',
        teamId: teamId,
        reportDate: new Date('2024-01-14T08:30:00Z'),
        yesterdayAccomplishments: 'API開発を完了した',
        todayPlans: 'テスト環境にデプロイする',
        challenges: 'データベース接続エラーが発生している',
        submittedAt: new Date('2024-01-14T08:45:00Z'),
      },
    ];

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'データベース接続エラー', frequency: 1 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(50),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    // Act
    const result = await extractAndRankIssueKeywords(
      {
        teamId: teamId,
        startDate: startDate,
        endDate: endDate,
        minFrequencyThreshold: minFrequencyThreshold,
        requestUserId: requestUserId,
      },
      mockReportData,
      mockTextAnalysisAdapter,
    );

    // Assert
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords.length).toBe(1);

    const extractedKeyword = result.keywords[0];
    expect(extractedKeyword.keyword).toBe('データベース接続エラー');
    expect(extractedKeyword.frequency).toBe(1);
    expect(extractedKeyword.rank).toBe(1);
    expect(extractedKeyword.keywordId).toBeDefined();

    expect(result.totalKeywordCount).toBe(1);
    expect(result.extractedAt).toBeDefined();
    expect(result.analysisperiodDays).toBe(7);

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      'データベース接続エラーが発生している',
    );
  });
});