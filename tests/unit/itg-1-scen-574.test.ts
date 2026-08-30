import { saveExtractedIssueData } from '../../src/logic/issue-data-persistence';
import { type SaveExtractedIssueDataInput } from '../../src/logic/issue-data-persistence';

describe('朝会報告管理システム - 課題データ永続化', () => {
  // SCEN-574
  test('実行者IDが空のときに認証エラーをスローする', () => {
    const input: SaveExtractedIssueDataInput = {
      reportId: 'report-001',
      issueContent: '処理システムの応答が遅い',
      issueType: '技術的課題',
      priorityScore: 75,
      impactLevel: '高',
      extractedKeywords: ['応答遅延', 'パフォーマンス'],
      executorId: '',
    };

    expect(() => saveExtractedIssueData(input)).toThrow(/実行者/);
  });
});