import { verifyAdoptionReadiness } from '../../src/logic/adoption-training-management';

describe('朝会報告管理システム - 養成実施管理', () => {
  // SCEN-593: [error] 再提出された日報の3項目のいずれかが空または未入力のときという明示された境界条件ですべての項目を入力してください
  test('再提出日報の必須項目が空の場合、エラーをスローする', () => {
    const engineerSubmittedReport = {
      yesterdayWork: '',
      todayWork: '実装作業',
      currentIssue: '課題A'
    };

    const feedbackCriteria = {
      formatUnificationRequirement: true,
      issueSpecificityRequirement: true,
      inputCompletenessRequirement: true
    };

    const minimumQualityThreshold = 70;

    expect(() =>
      verifyAdoptionReadiness(
        engineerSubmittedReport,
        feedbackCriteria,
        minimumQualityThreshold
      )
    ).toThrow(/すべての項目を入力してください/);
  });
});