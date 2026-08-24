import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Duplicate Keyword Frequency Reflection', () => {
  // SCEN-1751: [edge] 課題キーワード自動抽出・優先度スコア算出機能 - 完全に同一の課題テキストが複数回抽出されたとき優先度スコアが重複度を反映する

  test('should calculate priority score reflecting duplicate keyword frequency correctly', async () => {
    // Setup: Mock TextAnalysisServiceAdapter
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'データベース接続エラー',
            frequency: 3,
            confidence: 0.95,
          },
        ],
        extractionTimestamp: new Date('2024-01-15T08:30:00Z'),
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        keyword: 'データベース接続エラー',
        impactScore: 45,
        affectedSystems: ['ProductionDB', 'ReplicationService'],
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        keyword: 'データベース接続エラー',
        severity: 'high',
      }),
    };

    // Input: Report text containing the same issue keyword 3 times
    const reportText =
      '昨日: システムデバッグ。データベース接続エラーが発生。今日: データベース接続エラーの修正予定。課題: データベース接続エラーが本番環境でも再現する';

    const extractionInput = {
      teamId: 'team-001',
      reportTexts: [reportText],
      analysisContext: {
        analysisDate: new Date('2024-01-15T08:30:00Z'),
        teamContextData: {
          recentIssueHistory: [],
          teamCapacity: 10,
        },
      },
      textAnalysisAdapter: mockTextAnalysisAdapter,
    };

    // Execute: Call the function with mock adapter
    const result = await extractAndRankIssueKeywords(extractionInput);

    // Verify: Extract keyword should exist
    expect(result.keywords).toBeDefined();
    expect(result.keywords.length).toBeGreaterThan(0);

    // Find the keyword "データベース接続エラー" in the result
    const dbConnectionErrorKeyword = result.keywords.find(
      (k) => k.keyword === 'データベース接続エラー'
    );

    expect(dbConnectionErrorKeyword).toBeDefined();
    expect(dbConnectionErrorKeyword?.keyword).toBe('データベース接続エラー');
    expect(dbConnectionErrorKeyword?.frequency).toBe(3);

    // Verify: Priority score should reflect duplicate frequency
    // Base score: 45, frequency bonus: (3 - 1) * 10 = 20
    // Expected score: 45 + 20 = 65
    const expectedPriorityScore = 65;
    expect(dbConnectionErrorKeyword?.priorityScore).toBe(expectedPriorityScore);

    // Verify: Score should be higher than single occurrence (45)
    expect(dbConnectionErrorKeyword?.priorityScore).toBeGreaterThan(45);

    // Verify: Rank should be 1 (highest frequency)
    expect(dbConnectionErrorKeyword?.rank).toBe(1);

    // Verify: Mock adapter methods were called
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledWith(
      'データベース接続エラー'
    );

    // Verify: Result metadata
    expect(result.extractedAt).toBeDefined();
    expect(result.totalKeywordCount).toBeGreaterThan(0);
    expect(result.analysisPeriodDays).toBeDefined();
  });
});