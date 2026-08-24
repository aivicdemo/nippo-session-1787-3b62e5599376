import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput } from '../../src/logic/daily-report-management';

describe('Daily Report Management - Submit with Invalid Issue Severity', () => {
  test('SCEN-2654: submitDailyReport rejects invalid issue severity classification', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn().mockResolvedValue('invalid'),
    };

    const input: SubmitDailyReportInput = {
      userId: 'eng-001',
      teamId: 'team-alpha',
      yesterdayAccomplishment: 'バグ修正完了',
      todayPlan: 'テスト実施',
      challenges: 'ネットワーク遅延の原因調査',
      reportDate: '2024-01-15',
    };

    await expect(
      submitDailyReport(input, mockTextAnalysisAdapter),
    ).rejects.toThrow(/課題重要度/);
  });
});