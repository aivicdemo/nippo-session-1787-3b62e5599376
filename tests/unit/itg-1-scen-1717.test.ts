import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  test('SCEN-1717: 日報データが undefined のとき抽出処理がエラーになる', async () => {
    // Arrange: TextAnalysisServiceAdapter をスタブで置き換え
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockImplementation((reportData: any) => {
        if (reportData === undefined || reportData === null) {
          throw new Error('日報データが不正です');
        }
        return Promise.resolve({
          keywords: [],
          frequencies: {}
        });
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn()
    };

    // 日報データが undefined の状況をセットアップ
    const undefinedReportData = undefined;
    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001'
    };

    // Act & Assert: 抽出処理が TextAnalysisServiceAdapter を通じてエラーをスロー
    await expect(
      extractAndRankIssueKeywords(
        input,
        mockTextAnalysisServiceAdapter
      )
    ).rejects.toThrow(/日報データが不正です/);

    // Assert: extractKeywords へ undefined データが渡されたことを確認
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(
      undefinedReportData
    );
  });
});