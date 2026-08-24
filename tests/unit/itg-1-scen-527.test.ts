import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type TextAnalysisServiceAdapter } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度判定機能', () => {
  // SCEN-527
  test('日報テキストが空文字列の場合、処理を中断してエラーを返す', () => {
    const stubTextAnalysisServiceAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const emptyReportText = '';
    const teamId = 'team-001';
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-07T23:59:59Z');

    expect(() => {
      extractAndRankIssueKeywords(
        {
          teamId,
          startDate,
          endDate,
          minFrequencyThreshold: 1,
          requestUserId: 'user-001',
        },
        stubTextAnalysisServiceAdapter,
        [
          {
            reportId: 'report-001',
            reportDate: new Date('2024-01-01T09:00:00Z'),
            teamId,
            reporterUserId: 'user-002',
            yesterdayWork: emptyReportText,
            todayPlan: 'テスト実施予定',
            challenges: '進捗遅延の可能性あり',
            encryptedAt: new Date('2024-01-01T09:00:00Z'),
          },
        ]
      );
    }).toThrow(/入力値が無効|日報テキスト/);

    expect(stubTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});