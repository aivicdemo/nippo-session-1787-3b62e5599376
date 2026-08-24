import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出機能 - ランク付けロジックエラー処理', () => {
  test('SCEN-2998: 抽出されたキーワードの発生頻度が負の値のとき、ランク付けロジックがエラーになる', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: '障害', frequency: -5 },
        { keyword: 'バグ', frequency: 3 },
      ]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const reportText =
      '昨日の障害対応が遅れた。バグ報告が3件来た';

    expect(
      async () => {
        await extractAndRankIssueKeywords(
          {
            teamId: 'team-001',
            startDate: new Date('2024-01-08T00:00:00Z'),
            endDate: new Date('2024-01-14T23:59:59Z'),
            minFrequencyThreshold: 1,
            requestUserId: 'user-001',
          },
          mockTextAnalysisServiceAdapter,
          [{ content: reportText, date: new Date('2024-01-10T09:00:00Z') }],
        );
      },
    ).rejects.toThrow(/発生頻度は0以上/);
  });
});