import { detectAndNotifyUnsubmitted } from '../../src/logic/submission-status-management';

describe('submission-status-management', () => {
  // SCEN-047: [error] 日報収集から課題抽出・配信までの自律実行 AIエージェント - 「日報収集から課題抽出・配信までの自律実行」が「重大インシデント・顧客クレームが報告された場合」の場合に副作用の確定前に人へ引き継ぐ
  test('should escalate to human and halt auto-delivery when critical incident with customer complaint is detected', async () => {
    const reportDataWithCriticalIncident = [
      {
        memberId: 'M001',
        submittedAt: '2024-01-15T09:00:00Z',
        content: 'Progress on Task A',
        issues: [],
      },
      {
        memberId: 'M002',
        submittedAt: '2024-01-15T09:05:00Z',
        content: 'Progress on Task B',
        issues: [],
      },
      {
        memberId: 'M003',
        submittedAt: '2024-01-15T09:10:00Z',
        content: 'Progress on Task C',
        issues: [],
      },
      {
        memberId: 'M004',
        submittedAt: '2024-01-15T09:15:00Z',
        content: 'Progress on Task D',
        issues: [],
      },
      {
        memberId: 'M005',
        submittedAt: '2024-01-15T09:20:00Z',
        content: 'Progress on Task E',
        issues: [],
      },
      {
        memberId: 'M006',
        submittedAt: '2024-01-15T09:25:00Z',
        content: 'Progress on Task F',
        issues: [],
      },
      {
        memberId: 'M007',
        submittedAt: '2024-01-15T09:30:00Z',
        content: 'Progress on Task G',
        issues: [],
      },
      {
        memberId: 'M008',
        submittedAt: '2024-01-15T09:35:00Z',
        content: 'Progress on Task H',
        issues: [],
      },
      {
        memberId: 'M009',
        submittedAt: '2024-01-15T09:40:00Z',
        content: 'Progress on Task I',
        issues: [],
      },
      {
        memberId: 'M010',
        submittedAt: '2024-01-15T09:45:00Z',
        content:
          '重大インシデント：本番システム障害により顧客5社から緊急連絡あり',
        issues: [
          {
            type: 'critical_incident',
            description: '重大インシデント・顧客クレーム',
            severity: 'critical',
          },
        ],
      },
    ];

    const escalationHandlerMock = jest.fn();
    const auditLoggerMock = jest.fn();
    const handoverMemoryMock: {
      extractedIssues: Array<{
        content: string;
        priority: string;
        timestamp: string;
      }>;
      escalationReason: string;
      detectedAt: string;
      executionTrace: string[];
      actionHalted: boolean;
      autoDeliverySent: boolean;
    } = {
      extractedIssues: [],
      escalationReason: '',
      detectedAt: '',
      executionTrace: [],
      actionHalted: false,
      autoDeliverySent: false,
    };

    const result = await detectAndNotifyUnsubmitted(
      reportDataWithCriticalIncident,
      {
        onEscalation: escalationHandlerMock,
        auditLog: auditLoggerMock,
        handoverMemory: handoverMemoryMock,
      }
    );

    expect(result.escalationDetected).toBe(true);
    expect(result.escalationType).toBe('critical_incident_customer_complaint');
    expect(result.autoDeliveryHalted).toBe(true);

    expect(handoverMemoryMock.extractedIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          content: '重大インシデント・顧客クレーム',
          severity: 'critical',
        }),
      ])
    );

    expect(handoverMemoryMock.escalationReason).toBe(
      '重大インシデント・顧客クレーム'
    );
    expect(handoverMemoryMock.detectedAt).toBe('2024-01-15T09:45:00Z');
    expect(handoverMemoryMock.actionHalted).toBe(true);
    expect(handoverMemoryMock.autoDeliverySent).toBe(false);

    expect(escalationHandlerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        escalationType: 'critical_incident_customer_complaint',
        issues: expect.arrayContaining([
          expect.objectContaining({
            description: '重大インシデント・顧客クレーム',
            severity: 'critical',
          }),
        ]),
        timestamp: '2024-01-15T09:45:00Z',
      })
    );

    expect(auditLoggerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'escalation_detected',
        escalationType: 'critical_incident_customer_complaint',
        detectedAt: '2024-01-15T09:45:00Z',
        actionTaken: 'halt_auto_delivery_handover_to_human',
      })
    );

    expect(result.deliveryMailSent).toBe(false);
    expect(result.handoverNotificationSent).toBe(true);
    expect(result.manualReviewRequired).toBe(true);
  });
});