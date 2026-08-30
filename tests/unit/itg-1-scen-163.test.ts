import { describe, test, expect, jest } from '@jest/globals';
import { saveExtractedIssueData } from '../../src/logic/issue-data-persistence';

describe('朝会報告管理システム - 課題データ永続化', () => {
  // SCEN-163
  test('課題データの暗号化処理に失敗した場合、IssueDataEncryptionFailure エラーが発生する', () => {
    const input = {
      reportId: 'RPT-001',
      issueContent: 'データベース接続エラーが頻発',
      issueType: '技術的課題',
      priorityScore: 85,
      impactLevel: '高',
      extractedKeywords: ['データベース', '接続', 'エラー'],
      analysisResult: null,
      executorId: 'USR-USER01',
    };

    expect(() => {
      saveExtractedIssueData(input);
    }).toThrow(/課題データの暗号化に失敗しました/);
  });
});