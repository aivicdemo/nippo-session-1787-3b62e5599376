import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度スコア算出機能', () => {
  let mockTextAnalysisServiceAdapter: any;

  beforeEach(() => {
    mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1730
  test('抽出されたキーワード配列がnullのときに適切なエラーをスロー', async () => {
    const mockReportData = {
      previousDayActivities: 'レポート作成',
      todayPlannedActivities: '会議準備',
      challengeContent: 'システム遅延',
    };

    const mockNullKeywords = null;

    mockTextAnalysisServiceAdapter.extractKeywords.mockResolvedValue(
      mockNullKeywords
    );

    mockTextAnalysisServiceAdapter.assessImpactScore.mockImplementation(
      (keywords: any) => {
        if (keywords === null || keywords === undefined) {
          throw new Error('有効なキーワードが抽出されていません');
        }
        return { impactScore: 45 };
      }
    );

    const input = {
      teamId: 'team-001',
      reportData: mockReportData,
      textAnalysisAdapter: mockTextAnalysisServiceAdapter,
    };

    await expect(async () => {
      await extractAndRankIssueKeywords(input);
    }).rejects.toThrow(/有効なキーワード/);
  });
});