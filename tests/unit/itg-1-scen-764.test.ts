import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-764: [error] 課題自動抽出・優先度判定機能 - 抽出されたキーワードが空配列のとき、エラーを返す
  test('抽出されたキーワードが空配列のとき、エラーを返す', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const reportText = '昨日は報告書作成。今日は会議。課題なし。';
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const requestUserId = 'user-001';

    expect(async () => {
      await extractAndRankIssueKeywords(
        {
          teamId,
          startDate,
          endDate,
          minFrequencyThreshold: 1,
          requestUserId,
        },
        mockTextAnalysisServiceAdapter,
      );
    }).rejects.toThrow(/抽出されたキーワードが見つかりません/);
  });
});