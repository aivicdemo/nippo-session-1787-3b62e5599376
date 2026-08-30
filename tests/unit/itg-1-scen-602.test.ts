import { verifyAdoptionReadiness } from '../../src/logic/adoption-training-management';
import type { AdoptionReadinessVerificationInput } from '../../src/logic/adoption-training-management';

describe('朝会報告管理システム - 導入準備確認ロジック', () => {
  // SCEN-602
  test('チーム人数が0人以下の場合、エラーをスロー', () => {
    const input: AdoptionReadinessVerificationInput = {
      initialReportDataset: [],
      totalEngineerCount: 0,
      submissionDeadline: new Date('2026-08-19T00:00:00Z'),
    };

    expect(() => verifyAdoptionReadiness(input)).toThrow(/チーム人数/);
  });
});