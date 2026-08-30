import { verifyAdoptionReadiness } from '../../src/logic/adoption-training-management';

describe('朝会報告管理システム - 導入準備確認', () => {
  // SCEN-595: [edge] 初回テスト報告データから提出率・データ品質スコア・形式統一度を計算し、3条件すべて満たすかを判定して本格運用への移行可否を決定する。最低品質基準の値が0未満または100を超えるときという明示された境界条件で基準値は0～100の範囲で設定してください
  test('minimumQualityThresholdが境界値（-1, 0, 100, 101）のときの挙動を検証する', () => {
    const baselineData = {
      initialReportDataset: [
        {
          reportId: 'report-001',
          engineerId: 'eng-001',
          submittedAt: new Date('2024-01-15T08:00:00Z'),
          reportContent: 'Yesterday: completed task A. Today: start task B. Issues: dependency delay'
        },
        {
          reportId: 'report-002',
          engineerId: 'eng-002',
          submittedAt: new Date('2024-01-15T08:15:00Z'),
          reportContent: 'Yesterday: finished module review. Today: code integration. Issues: build failure'
        },
        {
          reportId: 'report-003',
          engineerId: 'eng-003',
          submittedAt: new Date('2024-01-15T08:30:00Z'),
          reportContent: 'Yesterday: unit tests completed. Today: system test. Issues: environment setup'
        },
        {
          reportId: 'report-004',
          engineerId: 'eng-004',
          submittedAt: new Date('2024-01-15T08:45:00Z'),
          reportContent: 'Yesterday: API development. Today: integration testing. Issues: connection timeout'
        },
        {
          reportId: 'report-005',
          engineerId: 'eng-005',
          submittedAt: new Date('2024-01-15T09:00:00Z'),
          reportContent: 'Yesterday: database schema design. Today: implementation. Issues: performance concerns'
        },
        {
          reportId: 'report-006',
          engineerId: 'eng-006',
          submittedAt: new Date('2024-01-15T09:15:00Z'),
          reportContent: 'Yesterday: front-end component creation. Today: styling. Issues: browser compatibility'
        },
        {
          reportId: 'report-007',
          engineerId: 'eng-007',
          submittedAt: new Date('2024-01-15T09:30:00Z'),
          reportContent: 'Yesterday: documentation writing. Today: review process. Issues: time constraint'
        },
        {
          reportId: 'report-008',
          engineerId: 'eng-008',
          submittedAt: new Date('2024-01-15T09:45:00Z'),
          reportContent: 'Yesterday: testing scenarios. Today: edge case testing. Issues: data validation'
        },
        {
          reportId: 'report-009',
          engineerId: 'eng-009',
          submittedAt: new Date('2024-01-15T10:00:00Z'),
          reportContent: 'Yesterday: code review completed. Today: refactoring. Issues: resource availability'
        },
        {
          reportId: 'report-010',
          engineerId: 'eng-010',
          submittedAt: new Date('2024-01-15T10:15:00Z'),
          reportContent: 'Yesterday: deployment preparation. Today: production release. Issues: rollback plan'
        }
      ],
      totalEngineerCount: 10,
      submissionDeadline: new Date('2024-01-15T09:30:00Z'),
      evaluationCriteria: {
        minQualityScore: 70,
        minFormatUnificationDegree: 85,
        minSubmissionRate: 90
      }
    };

    // テスト1: minimumQualityThresholdが-1の場合
    const resultNegative = verifyAdoptionReadiness(baselineData, -1);
    expect(resultNegative).toEqual(
      expect.objectContaining({
        isValid: false,
        error: expect.stringMatching(/基準値は0～100/)
      })
    );

    // テスト2: minimumQualityThresholdが101の場合
    const resultOver = verifyAdoptionReadiness(baselineData, 101);
    expect(resultOver).toEqual(
      expect.objectContaining({
        isValid: false,
        error: expect.stringMatching(/基準値は0～100/)
      })
    );

    // テスト3: minimumQualityThresholdが0の場合（境界値・最小値）
    const resultMin = verifyAdoptionReadiness(baselineData, 0);
    expect(resultMin).toEqual(
      expect.objectContaining({
        isValid: expect.any(Boolean),
        readinessStatus: expect.any(String),
        submissionRate: expect.any(Number),
        qualityScore: expect.any(Number),
        formatUnification: expect.any(Number)
      })
    );
    // 0は有効な基準値のため、品質判定が正常に実行されることを確認
    expect(resultMin.isValid).toBe(true);

    // テスト4: minimumQualityThresholdが100の場合（境界値・最大値）
    const resultMax = verifyAdoptionReadiness(baselineData, 100);
    expect(resultMax).toEqual(
      expect.objectContaining({
        isValid: expect.any(Boolean),
        readinessStatus: expect.any(String),
        submissionRate: expect.any(Number),
        qualityScore: expect.any(Number),
        formatUnification: expect.any(Number)
      })
    );
    // 100は有効な基準値のため、品質判定が正常に実行されることを確認
    expect(resultMax.isValid).toBe(true);

    // 提出率の検証: 10/10 = 100%
    expect(resultMin.submissionRate).toBe(100);
    expect(resultMax.submissionRate).toBe(100);

    // 形式統一度が0～100の範囲内であることを確認
    expect(resultMin.formatUnification).toBeGreaterThanOrEqual(0);
    expect(resultMin.formatUnification).toBeLessThanOrEqual(100);
    expect(resultMax.formatUnification).toBeGreaterThanOrEqual(0);
    expect(resultMax.formatUnification).toBeLessThanOrEqual(100);

    // 品質スコアが0～100の範囲内であることを確認
    expect(resultMin.qualityScore).toBeGreaterThanOrEqual(0);
    expect(resultMin.qualityScore).toBeLessThanOrEqual(100);
    expect(resultMax.qualityScore).toBeGreaterThanOrEqual(0);
    expect(resultMax.qualityScore).toBeLessThanOrEqual(100);
  });
});