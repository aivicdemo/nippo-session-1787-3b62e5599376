import { saveExtractedIssueData } from '../../src/logic/issue-data-persistence';
import { type SaveExtractedIssueDataInput } from '../../src/logic/issue-data-persistence';

describe('Issue Data Persistence', () => {
  // SCEN-576
  test('should throw error when priority logic version does not exist during audit log recording', async () => {
    const input: SaveExtractedIssueDataInput = {
      reportId: 'report-001',
      issueContent: 'Database connection timeout during peak hours',
      issueType: 'technical_issue',
      priorityScore: 75,
      impactLevel: 'high',
      extractedKeywords: ['database', 'timeout', 'performance'],
      analysisResult: {
        rootCause: 'Insufficient connection pool size',
        proposedCountermeasure: 'Increase connection pool from 50 to 100',
        estimatedResolutionDays: 3,
      },
      executorId: 'user-pm-001',
    };

    const invalidPriorityLogicVersion = 'v99.99.99';

    await expect(
      saveExtractedIssueData(
        input,
        invalidPriorityLogicVersion
      )
    ).rejects.toThrow(/指定されたロジックバージョンが見つかりません/);
  });
});