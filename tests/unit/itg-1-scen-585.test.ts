import { evaluateInitialReportSubmission } from '../../src/logic/adoption-training-management';
import { type InitialReportSubmissionInput } from '../../src/logic/adoption-training-management';

describe('朝会報告管理システム - 初回テスト報告評価', () => {
  // SCEN-585: [error] 各項目が10文字未満のときという明示された境界条件で各項目は10文字以上で入力してください
  test('should return FAILED status with feedback items when all fields are less than 10 characters', () => {
    const input: InitialReportSubmissionInput = {
      reportId: 'report-001',
      engineerId: 'eng-001',
      yesterdayAccomplishment: 'テスト実施',
      todayPlan: 'バグ修正',
      issuesAndConcerns: '環境構築',
      submissionTimestamp: new Date('2024-01-15T09:00:00Z'),
      trainingPhaseId: 'phase-001'
    };

    const result = evaluateInitialReportSubmission(input);

    expect(result.evaluationStatus).toBe('FAILED');
    expect(result.feedbackItems.length).toBeGreaterThan(0);
    expect(result.qualityScore).toBeLessThan(80);
    
    const feedbackMessages = result.feedbackItems.map(item => item.improvementInstruction).join(' ');
    expect(feedbackMessages).toMatch(/10文字以上/);
  });
});