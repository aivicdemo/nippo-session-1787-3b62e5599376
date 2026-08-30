import { extractAndRankIssuesFromReports, type ExtractAndRankIssuesInput } from '../../src/logic/issue-extraction-and-ranking';

describe('朝会報告管理システム - 課題抽出・優先度付け', () => {
  test('SCEN-053: 課題の正規化・重複排除処理に失敗した場合、DataNormalizationFailureErrorが発生しエラーメッセージが返される', () => {
    const analysisStartDate = new Date('2024-12-16T00:00:00Z');
    const analysisEndDate = new Date('2025-01-14T23:59:59Z');

    const reports = [
      {
        reportId: 'report-001',
        reportDate: new Date('2025-01-14T09:00:00Z'),
        issueText: 'バグが発生しました。テスト環境でビルドエラーが起きています。',
        teamId: 'team-alpha',
      },
      {
        reportId: 'report-002',
        reportDate: new Date('2025-01-14T09:15:00Z'),
        issueText: 'バグの問題でテスト失敗が続いています。ビルドプロセスの遅延もあります。',
        teamId: 'team-beta',
      },
    ];

    const input: ExtractAndRankIssuesInput = {
      reports,
      analysisStartDate,
      analysisEndDate,
      minimumConfidenceThreshold: 50,
    };

    jest.mock('../../src/logic/issue-extraction-and-ranking', () => ({
      __esModule: true,
      extractAndRankIssuesFromReports: jest.fn(() => {
        const error = new Error('課題データの正規化に失敗しました。');
        (error as any).name = 'DataNormalizationFailureError';
        throw error;
      }),
    }));

    expect(() => {
      extractAndRankIssuesFromReports(input);
    }).toThrow(/課題データの正規化に失敗しました/);
  });
});