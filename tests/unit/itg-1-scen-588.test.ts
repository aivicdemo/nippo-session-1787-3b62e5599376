import { evaluateInitialReportSubmission } from '../../src/logic/adoption-training-management';

describe('朝会報告管理システム', () => {
  // SCEN-588
  test('エンジニアの初回テスト報告データを検証し、必須項目・形式・品質基準を満たしているか判定して、合格なら受理、不合格なら修正指示を返す', () => {
    const reportId = 'RPT-20250101-001';
    const engineerId = 'ENG-001';
    const yesterdayAccomplishment = '昨日はAPI連携機能の仕様書レビューを実施し、設計上の矛盾点3件を指摘して修正対応を依頼しました。午後は修正内容の確認を行い、問題なく進行していることを確認しました。';
    const todayPlan = '本日はAPI連携機能の実装に着手し、認証エンドポイントの実装を完了予定です。午後は単体テストの作成を進めます。';
    const issuesAndConcerns = 'データベース接続タイムアウトの問題が本番環境で散発的に発生しています。ネットワークインフラチームと原因調査を予定しており、対応が遅れる可能性があります。';
    const submissionTimestamp = new Date('2025-01-01T08:30:00Z');
    const trainingPhaseId = 'PHASE-ADOPTION-001';

    const result = evaluateInitialReportSubmission(
      {
        reportId,
        engineerId,
        yesterdayAccomplishment,
        todayPlan,
        issuesAndConcerns,
        submissionTimestamp,
        trainingPhaseId,
      }
    );

    expect(result).toHaveProperty('reportId');
    expect(result.reportId).toBe(reportId);
    expect(result).toHaveProperty('evaluationStatus');
    expect(result.evaluationStatus).toBe('PASSED');
    expect(result).toHaveProperty('qualityScore');
    expect(typeof result.qualityScore).toBe('number');
    expect(result.qualityScore).toBeGreaterThanOrEqual(80);
    expect(result).toHaveProperty('formatUnificationDegree');
    expect(result.formatUnificationDegree).toBe(100);
    expect(result).toHaveProperty('feedbackItems');
    expect(Array.isArray(result.feedbackItems)).toBe(true);
    expect(result.feedbackItems.length).toBe(0);
    expect(result).toHaveProperty('evaluationTimestamp');
    expect(result.evaluationTimestamp instanceof Date).toBe(true);
  });
});