import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出・ランキング機能', () => {
  // SCEN-754
  test('発生頻度がundefinedのとき、エラーを返す', () => {
    // Arrange: TextAnalysisServiceAdapterのスタブを準備
    const textAnalysisServiceStub = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: '機能Cのバグ対応',
            frequency: undefined, // 発生頻度がundefined
          },
        ],
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const reportingDate = '2024-01-15T09:00:00Z';
    const extractInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-15T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const reportText = '昨日は機能A実装、今日は機能B実装、課題は機能Cのバグ対応';

    // Act & Assert
    expect(async () => {
      await extractAndRankIssueKeywords(
        extractInput,
        textAnalysisServiceStub,
        reportText,
        reportingDate
      );
    }).rejects.toThrow(/発生頻度が未定義です/);
  });
});