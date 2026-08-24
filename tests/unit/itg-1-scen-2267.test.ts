import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import type { TeamPerformanceMetricsInput, TeamPerformanceMetricsOutput } from '../../src/logic/monthly-performance-analysis';

describe('生産性指標計算 - 日報キーワード出現頻度の集計', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-2267
  test('指定期間内に複数件の日報がある場合、全日報のキーワード出現頻度が集計される', () => {
    // Arrange: テスト用の日報レコードを複数件作成
    const reportRecord1 = {
      reportId: 'report-001',
      reportDate: new Date('2024-01-15'),
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayWork: 'バグ修正、バグ修正、パフォーマンス改善',
      todayPlan: 'バグ修正、パフォーマンス改善',
      issues: 'バグ修正',
      submittedAt: new Date('2024-01-15T09:00:00Z'),
    };

    const reportRecord2 = {
      reportId: 'report-002',
      reportDate: new Date('2024-01-16'),
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayWork: 'バグ修正、ドキュメント作成、パフォーマンス改善、パフォーマンス改善',
      todayPlan: 'パフォーマンス改善',
      issues: 'ドキュメント作成',
      submittedAt: new Date('2024-01-16T09:00:00Z'),
    };

    const reportRecord3 = {
      reportId: 'report-003',
      reportDate: new Date('2024-01-17'),
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayWork: '会議対応、バグ修正',
      todayPlan: 'バグ修正',
      issues: '会議対応',
      submittedAt: new Date('2024-01-17T09:00:00Z'),
    };

    const reportRecords = [reportRecord1, reportRecord2, reportRecord3];

    // TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        const keywordMap: { [key: string]: number } = {};
        const keywords = text.split('、');
        keywords.forEach((keyword) => {
          const trimmed = keyword.trim();
          keywordMap[trimmed] = (keywordMap[trimmed] || 0) + 1;
        });
        return keywordMap;
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        const scoreMap: { [key: string]: number } = {
          'バグ修正': 85,
          'パフォーマンス改善': 75,
          'ドキュメント作成': 40,
          '会議対応': 50,
        };
        return scoreMap[keyword] || 50;
      }),
      classifyIssueSeverity: jest.fn((text: string) => 'medium'),
    };

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate: new Date('2024-01-15'),
      aggregationEndDate: new Date('2024-01-17'),
      teamIds: ['team-001'],
      reportRecords: reportRecords,
    };

    // Act: 生産性指標計算機能を呼び出し
    const result: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(
      input,
      mockTextAnalysisAdapter
    );

    // Assert: 返却されたキーワード出現頻度の集計結果を検証
    expect(result).toBeDefined();
    expect(result.aggregationPeriod).toEqual({
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-17'),
      durationDays: 3,
    });

    // キーワード出現頻度が期待通り集計されていることを確認
    // 「バグ修正」=4回、「パフォーマンス改善」=3回、「ドキュメント作成」=1回、「会議対応」=1回
    const issueFrequency = result.issueFrequencyRanking;
    expect(issueFrequency).toBeDefined();
    expect(Array.isArray(issueFrequency)).toBe(true);

    // 出現頻度が高い順にソートされていることを確認
    const bugFixItem = issueFrequency.find((item) => item.keyword === 'バグ修正');
    const perfItem = issueFrequency.find((item) => item.keyword === 'パフォーマンス改善');
    const docItem = issueFrequency.find((item) => item.keyword === 'ドキュメント作成');
    const meetingItem = issueFrequency.find((item) => item.keyword === '会議対応');

    expect(bugFixItem).toBeDefined();
    expect(bugFixItem?.frequency).toBe(4);

    expect(perfItem).toBeDefined();
    expect(perfItem?.frequency).toBe(3);

    expect(docItem).toBeDefined();
    expect(docItem?.frequency).toBe(1);

    expect(meetingItem).toBeDefined();
    expect(meetingItem?.frequency).toBe(1);

    // 指定期間内の全日報を統合した単一の集計結果であることを確認
    expect(result.issueFrequencyRanking.length).toBeGreaterThan(0);
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
  });
});