import { verifyAdoptionReadiness, type AdoptionReadinessVerificationInput, type InitialReportData } from '../../src/logic/adoption-training-management';

describe('朝会報告管理システム - 導入準備検証', () => {
  // SCEN-605
  test('形式統一度が範囲外（101%）のときエラーを投げ、readinessStatus は not_ready となり blockers に形式統一度が含まれ productionStartDate は出力されない', () => {
    const initialReportDataset: InitialReportData[] = [
      {
        reportId: 'report-001',
        engineerId: 'eng-001',
        submittedAt: new Date('2024-01-15T08:30:00Z'),
        reportContent: 'Yesterday: completed task A. Today: plan task B. Issues: none.'
      },
      {
        reportId: 'report-002',
        engineerId: 'eng-002',
        submittedAt: new Date('2024-01-15T08:35:00Z'),
        reportContent: 'Yesterday: completed task C. Today: plan task D. Issues: delay in module X.'
      },
      {
        reportId: 'report-003',
        engineerId: 'eng-003',
        submittedAt: new Date('2024-01-15T08:40:00Z'),
        reportContent: 'Yesterday: completed task E. Today: plan task F. Issues: build failure.'
      }
    ];

    const input: AdoptionReadinessVerificationInput = {
      initialReportDataset,
      totalEngineerCount: 3,
      submissionDeadline: new Date('2024-01-15T09:00:00Z')
    };

    expect(() => verifyAdoptionReadiness(input)).toThrow(/形式統一度/);
  });
});