import { evaluateInitialReportSubmission } from '../../src/logic/adoption-training-management';

describe('adoption-training-management', () => {
  // SCEN-122: [normal] エンジニアの初回テスト報告データを検証し、必須項目・形式・品質基準を満たしているか判定して、合格なら受理、不合格なら修正指示を返す
  test('evaluateInitialReportSubmission processes valid initial report submission and returns PASSED status with quality score and format unification degree', () => {
    const reportId = 'RPT-001';
    const engineerId = 'ENG-001';
    const yesterdayAccomplishment = '昨日は機能Aの実装を完了しました';
    const todayPlan = '本日は機能Bの設計を進めます';
    const issuesAndConcerns = 'データベース接続のタイムアウト問題が発生';
    const submissionTimestamp = new Date('2024-01-15T10:00:00Z');
    const trainingPhaseId = 'PHASE-001';

    const input = {
      reportId,
      engineerId,
      yesterdayAccomplishment,
      todayPlan,
      issuesAndConcerns,
      submissionTimestamp,
      trainingPhaseId,
    };

    const result = evaluateInitialReportSubmission(input);

    expect(result.reportId).toBe('RPT-001');
    expect(result.evaluationStatus).toBe('PASSED');
    expect(result.qualityScore).toBe(85);
    expect(result.formatUnificationDegree).toBe(90);
    expect(result.feedbackItems).toEqual([]);
    expect(result.evaluationTimestamp).toBeInstanceOf(Date);
  });
});