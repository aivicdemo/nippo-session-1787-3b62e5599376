import { generateAndSendConfirmationEmail } from '../../src/logic/notification-delivery';
import { type ConfirmationEmailInput, type ConfirmationEmailOutput } from '../../src/logic/notification-delivery';

describe('朝会報告集約・課題抽出・優先度判定・確認メール自動生成配信機能', () => {
  // SCEN-452
  test('チームメンバー10名のうち1名以上の報告データがnullのとき処理を中止しエラーを返す', () => {
    const reportDeadlineDateTime = new Date('2024-01-15T09:00:00Z');
    const analysisDate = new Date('2024-01-15T00:00:00Z');

    const aggregatedReports: ConfirmationEmailInput['aggregatedReports'] = [
      {
        reportId: 'report-001',
        reporterUserId: 'user-001',
        reporterName: 'メンバー1',
        yesterdayAccomplishment: '〇〇完了',
        todayPlan: '△△着手',
        challenges: '課題なし',
        submissionDateTime: new Date('2024-01-14T08:30:00Z'),
      },
      {
        reportId: 'report-002',
        reporterUserId: 'user-002',
        reporterName: 'メンバー2',
        yesterdayAccomplishment: '〇〇完了',
        todayPlan: '△△着手',
        challenges: '課題なし',
        submissionDateTime: new Date('2024-01-14T08:31:00Z'),
      },
      {
        reportId: 'report-003',
        reporterUserId: 'user-003',
        reporterName: 'メンバー3',
        yesterdayAccomplishment: '〇〇完了',
        todayPlan: '△△着手',
        challenges: '課題なし',
        submissionDateTime: new Date('2024-01-14T08:32:00Z'),
      },
      {
        reportId: 'report-004',
        reporterUserId: 'user-004',
        reporterName: 'メンバー4',
        yesterdayAccomplishment: '〇〇完了',
        todayPlan: '△△着手',
        challenges: '課題なし',
        submissionDateTime: new Date('2024-01-14T08:33:00Z'),
      },
      {
        reportId: 'report-005',
        reporterUserId: 'user-005',
        reporterName: 'メンバー5',
        yesterdayAccomplishment: '〇〇完了',
        todayPlan: '△△着手',
        challenges: '課題なし',
        submissionDateTime: new Date('2024-01-14T08:34:00Z'),
      },
      {
        reportId: 'report-006',
        reporterUserId: 'user-006',
        reporterName: 'メンバー6',
        yesterdayAccomplishment: '〇〇完了',
        todayPlan: '△△着手',
        challenges: '課題なし',
        submissionDateTime: new Date('2024-01-14T08:35:00Z'),
      },
      {
        reportId: 'report-007',
        reporterUserId: 'user-007',
        reporterName: 'メンバー7',
        yesterdayAccomplishment: '〇〇完了',
        todayPlan: '△△着手',
        challenges: '課題なし',
        submissionDateTime: new Date('2024-01-14T08:36:00Z'),
      },
      {
        reportId: 'report-008',
        reporterUserId: 'user-008',
        reporterName: 'メンバー8',
        yesterdayAccomplishment: '〇〇完了',
        todayPlan: '△△着手',
        challenges: '課題なし',
        submissionDateTime: new Date('2024-01-14T08:37:00Z'),
      },
      {
        reportId: 'report-009',
        reporterUserId: 'user-009',
        reporterName: 'メンバー9',
        yesterdayAccomplishment: '〇〇完了',
        todayPlan: '△△着手',
        challenges: '課題なし',
        submissionDateTime: new Date('2024-01-14T08:38:00Z'),
      },
      null as any,
    ];

    const input: ConfirmationEmailInput = {
      reportDeadlineDateTime,
      aggregatedReports,
      managerUserId: 'manager-001',
      teamId: 'team-001',
      analysisDate,
    };

    expect(() => generateAndSendConfirmationEmail(input)).toThrow(/報告データ/);
  });
});