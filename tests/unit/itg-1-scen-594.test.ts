import { verifyAdoptionReadiness } from '../../src/logic/adoption-training-management';

describe('朝会報告管理システム', () => {
  // SCEN-594
  test('[error] 初回テスト報告データから提出率・データ品質スコア・形式統一度を計算し、3条件すべて満たすかを判定して本格運用への移行可否を決定する。 - 品質スコアが計算不可能なほどデータが不正なときという明示された境界条件で日報データが不正です。再度入力してください', () => {
    const invalidReportData = {
      reportId: 'report-001',
      engineerId: 'eng-001',
      yesterdayWork: null,
      todayWork: 'planned task',
      issues: 'some issue',
    };

    const validReportData = {
      reportId: 'report-002',
      engineerId: 'eng-002',
      yesterdayWork: 'completed task',
      todayWork: 'planned task',
      issues: 'some issue',
    };

    const initialReportDataset = [invalidReportData, validReportData];
    const totalEngineerCount = 2;
    const submissionDeadline = new Date('2024-01-15T09:30:00Z');

    const evaluationCriteria = {
      minQualityScore: 70,
      minFormatUnificationDegree: 85,
      minSubmissionRate: 90,
    };

    expect(() =>
      verifyAdoptionReadiness(
        initialReportDataset as any,
        totalEngineerCount,
        submissionDeadline,
        evaluationCriteria
      )
    ).toThrow(/日報データが不正です/);
  });
});