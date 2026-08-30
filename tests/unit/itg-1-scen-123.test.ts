import { evaluateInitialReportSubmission } from '../../src/logic/adoption-training-management';

describe('朝会報告管理システム - 初回テスト報告検証', () => {
  // SCEN-123: [error] エンジニアの初回テスト報告データを検証し、必須項目・形式・品質基準を満たしているか判定して、合格なら受理、不合格なら修正指示を返す。 - 必須項目（昨日の実績、本日の予定、課題・懸念事項）のいずれかが空白または未入力の場合。
  test('必須項目（昨日の実績）が空文字列のとき、RequiredFieldMissingErrorをスロー', () => {
    const reportId = 'RPT-001';
    const engineerId = 'ENG-123';
    const yesterdayAccomplishment = '';
    const todayPlan = '本日の予定テキスト';
    const issuesAndConcerns = '課題テキスト';
    const submissionTimestamp = new Date('2024-01-15T10:00:00Z');
    const trainingPhaseId = 'PHASE-001';

    expect(() => {
      evaluateInitialReportSubmission(
        reportId,
        engineerId,
        yesterdayAccomplishment,
        todayPlan,
        issuesAndConcerns,
        submissionTimestamp,
        trainingPhaseId
      );
    }).toThrow(/必須項目/);
  });
});