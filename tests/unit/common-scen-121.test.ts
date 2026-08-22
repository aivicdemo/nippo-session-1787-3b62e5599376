import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  test('SCEN-121: idempotent retry skips duplicate notifications and report generation', async () => {
    const reportGenerationRecords: Array<{ id: string; generatedAt: string }> = [];
    const notificationLogs: Array<{ id: string; recipientType: string; timestamp: string }> = [];
    const auditEventLogs: Array<{ action: string; status: string; timestamp: string }> = [];
    const emailQueueEntries: Array<{ reportId: string; recipient: string; enqueuedAt: string }> = [];

    const mockNotificationClient = {
      extractUnsubmittedMembers: async (aggregatedReportData: object) => {
        return ['member-001', 'member-002'];
      },
      sendReminderNotification: async (memberIds: string[], targetDate: Date) => {
        const notificationId = `notif-${Date.now()}-${Math.random()}`;
        notificationLogs.push({
          id: notificationId,
          recipientType: 'member',
          timestamp: new Date().toISOString(),
        });
        return { notificationId, sentCount: memberIds.length };
      },
      recordReportGeneration: async (reportData: object, generatedDate: Date) => {
        const reportId = `report-${generatedDate.toISOString().split('T')[0]}`;
        reportGenerationRecords.push({ id: reportId, generatedAt: generatedDate.toISOString() });
        return reportId;
      },
      sendDirectorNotification: async (reportId: string, directorEmail: string) => {
        const notificationId = `notif-dir-${Date.now()}`;
        notificationLogs.push({
          id: notificationId,
          recipientType: 'director',
          timestamp: new Date().toISOString(),
        });
        emailQueueEntries.push({
          reportId,
          recipient: directorEmail,
          enqueuedAt: new Date().toISOString(),
        });
        return notificationId;
      },
      sendStakeholderNotification: async (reportId: string, stakeholderEmails: string[]) => {
        const notificationId = `notif-stake-${Date.now()}`;
        notificationLogs.push({
          id: notificationId,
          recipientType: 'stakeholder',
          timestamp: new Date().toISOString(),
        });
        for (const email of stakeholderEmails) {
          emailQueueEntries.push({
            reportId,
            recipient: email,
            enqueuedAt: new Date().toISOString(),
          });
        }
        return notificationId;
      },
      recordAuditEvent: async (action: string, status: string, details: object) => {
        auditEventLogs.push({
          action,
          status,
          timestamp: new Date().toISOString(),
        });
        return { eventId: `audit-${Date.now()}`, recorded: true };
      },
      checkDuplicateExecution: async (executionKey: string) => {
        return reportGenerationRecords.length > 0 ? { isDuplicate: true, previousReportId: reportGenerationRecords[0].id } : { isDuplicate: false };
      },
    };

    const executionKey = 'tx6-weekly-2024-01-15-report';
    const targetDate = new Date('2024-01-15T06:00:00Z');
    const aggregatedReportData = { week: '2024-W03', teamIds: ['team-001'] };
    const directorEmail = 'director@company.com';
    const stakeholderEmails = ['stakeholder-001@company.com', 'stakeholder-002@company.com'];

    await sendUnsubmittedReminder({
      executionKey,
      targetDate,
      aggregatedReportData,
      directorEmail,
      stakeholderEmails,
      aiClient: mockNotificationClient,
    });

    const firstRunReportCount = reportGenerationRecords.length;
    const firstRunNotificationCount = notificationLogs.length;
    const firstRunEmailQueueCount = emailQueueEntries.length;
    const firstRunReportId = reportGenerationRecords[0]?.id;

    expect(firstRunReportCount).toBe(1);
    expect(firstRunNotificationCount).toBe(2);
    expect(firstRunEmailQueueCount).toBe(3);
    expect(firstRunReportId).toBeDefined();

    auditEventLogs.length = 0;
    notificationLogs.length = 0;
    emailQueueEntries.length = 0;

    await sendUnsubmittedReminder({
      executionKey,
      targetDate,
      aggregatedReportData,
      directorEmail,
      stakeholderEmails,
      aiClient: mockNotificationClient,
    });

    const secondRunReportCount = reportGenerationRecords.length;
    const secondRunNotificationCount = notificationLogs.length;
    const secondRunEmailQueueCount = emailQueueEntries.length;
    const secondRunReportId = reportGenerationRecords[1]?.id;

    expect(secondRunReportCount).toBe(1);
    expect(secondRunNotificationCount).toBe(0);
    expect(secondRunEmailQueueCount).toBe(0);
    expect(secondRunReportId).toBeUndefined();
    expect(firstRunReportId).toBe(reportGenerationRecords[0]?.id);

    const auditSkipEvent = auditEventLogs.find((e) => e.status === 'skipped_duplicate');
    expect(auditSkipEvent).toBeDefined();
    expect(auditSkipEvent?.action).toBe('report_generation_attempted');
  });
});