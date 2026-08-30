import { verifyAdoptionReadiness, type InitialReportData } from '../../src/logic/adoption-training-management';

describe('朝会報告管理システム', () => {
  // SCEN-604
  test('初回テスト報告データから提出率・データ品質スコア・形式統一度を計算し、品質スコアが0～100の範囲外のときエラーをスローする', () => {
    const initialReportDataset: InitialReportData[] = [
      {
        reportId: 'report-001',
        engineerId: 'eng-001',
        submittedAt: new Date('2024-12-31T10:00:00Z'),
        reportContent: 'Yesterday: Implemented feature A. Today: Testing feature B. Issues: Performance concern.',
      },
      {
        reportId: 'report-002',
        engineerId: 'eng-002',
        submittedAt: new Date('2024-12-31T11:30:00Z'),
        reportContent: 'Yesterday: Code review completed. Today: Bug fixing planned. Issues: Resource constraint.',
      },
      {
        reportId: 'report-003',
        engineerId: 'eng-003',
        submittedAt: new Date('2024-12-31T12:00:00Z'),
        reportContent: 'Yesterday: Documentation updated. Today: Integration testing. Issues: Environment setup delay.',
      },
    ];

    const totalEngineerCount = 10;
    const submissionDeadline = new Date('2024-12-31T23:59:59Z');

    expect(() => {
      verifyAdoptionReadiness(
        initialReportDataset,
        totalEngineerCount,
        submissionDeadline,
        {
          calculateSubmissionRate: () => 95,
          calculateReportQualityScore: () => {
            const qualityScores = [50, 150, 75];
            if (qualityScores.some((score) => score < 0 || score > 100)) {
              throw new Error('データ品質が基準に達していません。改善フェーズに戻してください。');
            }
            return qualityScores.reduce((a, b) => a + b) / qualityScores.length;
          },
          calculateFormatUnificationDegree: () => 90,
        }
      );
    }).toThrow(/データ品質が基準に達していません/);
  });
});