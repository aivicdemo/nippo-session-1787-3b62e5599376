import { verifyAdoptionReadiness } from '../../src/logic/adoption-training-management';

describe('朝会報告管理システム - 導入準備完了度検証', () => {
  test('SCEN-126: 初回テスト報告の提出率が90%未満の場合、提出率基準エラーがスローされる', () => {
    // Arrange
    const initialReportDataset = [
      {
        reportId: 'report-001',
        engineerId: 'eng-001',
        submittedAt: new Date('2024-01-15T08:00:00Z'),
        reportContent: 'Yesterday accomplished task A. Today plan task B. Issue: none',
      },
      {
        reportId: 'report-002',
        engineerId: 'eng-002',
        submittedAt: new Date('2024-01-15T08:05:00Z'),
        reportContent: 'Yesterday accomplished task C. Today plan task D. Issue: none',
      },
      {
        reportId: 'report-003',
        engineerId: 'eng-003',
        submittedAt: new Date('2024-01-15T08:10:00Z'),
        reportContent: 'Yesterday accomplished task E. Today plan task F. Issue: build error',
      },
      {
        reportId: 'report-004',
        engineerId: 'eng-004',
        submittedAt: new Date('2024-01-15T08:15:00Z'),
        reportContent: 'Yesterday accomplished task G. Today plan task H. Issue: none',
      },
      {
        reportId: 'report-005',
        engineerId: 'eng-005',
        submittedAt: new Date('2024-01-15T08:20:00Z'),
        reportContent: 'Yesterday accomplished task I. Today plan task J. Issue: test failure',
      },
      {
        reportId: 'report-006',
        engineerId: 'eng-006',
        submittedAt: new Date('2024-01-15T08:25:00Z'),
        reportContent: 'Yesterday accomplished task K. Today plan task L. Issue: none',
      },
      {
        reportId: 'report-007',
        engineerId: 'eng-007',
        submittedAt: new Date('2024-01-15T08:30:00Z'),
        reportContent: 'Yesterday accomplished task M. Today plan task N. Issue: deployment delay',
      },
      {
        reportId: 'report-008',
        engineerId: 'eng-008',
        submittedAt: new Date('2024-01-15T08:35:00Z'),
        reportContent: 'Yesterday accomplished task O. Today plan task P. Issue: none',
      },
    ];

    const totalEngineerCount = 10;
    const submissionDeadline = new Date('2024-01-15T09:00:00Z');

    const mockCalculateSubmissionRate = jest.fn().mockReturnValue(0.8);
    const mockCalculateReportQualityScore = jest.fn().mockReturnValue(85);
    const mockCalculateFormatUnificationDegree = jest.fn().mockReturnValue(0.9);

    // Act & Assert
    expect(() => {
      verifyAdoptionReadiness(
        initialReportDataset,
        totalEngineerCount,
        submissionDeadline,
        mockCalculateSubmissionRate,
        mockCalculateReportQualityScore,
        mockCalculateFormatUnificationDegree,
      );
    }).toThrow(/提出率/);
  });
});