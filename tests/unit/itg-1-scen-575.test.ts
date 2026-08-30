import { saveExtractedIssueData } from '../../src/logic/issue-data-persistence';

describe('朝会報告管理システム - 課題データ永続化', () => {
  // SCEN-575
  test('抽出済み課題データを保存する際に、データ集計期間の開始日が終了日より後の場合、エラーをスロー', () => {
    const invalidInput = {
      reportId: 'report-001',
      issueContent: 'Build failure on production server',
      issueType: 'technical_issue',
      priorityScore: 85,
      impactLevel: 'high',
      extractedKeywords: ['build', 'production', 'server'],
      analysisResult: {
        rootCause: 'Deployment script error',
        proposedCountermeasure: 'Rollback to previous version',
        estimatedResolutionDays: 2
      },
      executorId: 'user-pm-001',
      dataRangeStart: new Date('2024-01-15T00:00:00Z'),
      dataRangeEnd: new Date('2024-01-10T00:00:00Z')
    };

    expect(() => saveExtractedIssueData(invalidInput)).toThrow(/データ集計期間/);
  });
});