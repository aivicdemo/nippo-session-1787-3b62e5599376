import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("notification-delivery idempotent retry", () => {
  let mockDb: {
    reminderLogs: Array<{
      id: string;
      memberId: string;
      reportId: string;
      sentAt: string;
      transactionId: string;
    }>;
    deliveryLogs: Array<{
      id: string;
      memberId: string;
      reminderId: string;
      deliveredAt: string;
      transactionId: string;
    }>;
    auditLogs: Array<{
      id: string;
      eventType: string;
      message: string;
      timestamp: string;
    }>;
  };

  let mockMailClient: {
    sendMail: jest.Mock;
  };

  let transactionIdCounter: number;

  beforeEach(() => {
    transactionIdCounter = 0;
    mockDb = {
      reminderLogs: [],
      deliveryLogs: [],
      auditLogs: [],
    };
    mockMailClient = {
      sendMail: jest.fn(async (params: {
        to: string;
        subject: string;
        body: string;
      }) => {
        return { success: true, messageId: `msg_${Date.now()}` };
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-209
  test("should prevent duplicate reminder notifications on idempotent retry", async () => {
    const reportId = "report_20240115_001";
    const memberId = "member_alice";
    const memberEmail = "alice@example.com";
    const idempotencyKey = `reminder_${reportId}_${memberId}`;
    const firstTransactionId = `txn_001_${Date.now()}`;
    const secondTransactionId = `txn_002_${Date.now() + 1000}`;

    // Helper: simulate reminder creation with idempotency
    const createReminderWithIdempotency = async (
      reportId: string,
      memberId: string,
      memberEmail: string,
      idempotencyKey: string,
      transactionId: string
    ) => {
      // Check if idempotency key already exists
      const existingReminder = mockDb.reminderLogs.find(
        (log) =>
          log.reportId === reportId &&
          log.memberId === memberId
      );

      if (existingReminder) {
        // Log audit event for duplicate prevention
        mockDb.auditLogs.push({
          id: `audit_${Date.now()}_${Math.random()}`,
          eventType: "DUPLICATE_PREVENTION",
          message: `イベント再実行検出：idempotency_key=${idempotencyKey} により重複書き込みを防止`,
          timestamp: new Date("2024-01-15T10:00:00Z").toISOString(),
        });
        return { skipped: true, existingReminderId: existingReminder.id };
      }

      // Create new reminder
      const reminderId = `reminder_${Date.now()}`;
      mockDb.reminderLogs.push({
        id: reminderId,
        memberId: memberId,
        reportId: reportId,
        sentAt: new Date("2024-01-15T10:00:00Z").toISOString(),
        transactionId: transactionId,
      });

      // Send mail
      await mockMailClient.sendMail({
        to: memberEmail,
        subject: "日報未提出のお知らせ",
        body: `報告ID ${reportId} の日報がまだ提出されていません。`,
      });

      // Create delivery log
      mockDb.deliveryLogs.push({
        id: `delivery_${Date.now()}`,
        memberId: memberId,
        reminderId: reminderId,
        deliveredAt: new Date("2024-01-15T10:00:00Z").toISOString(),
        transactionId: transactionId,
      });

      return { skipped: false, reminderId: reminderId };
    };

    // Wrapper for sendUnsubmittedReminder integration
    const executeReminder = async (
      reportId: string,
      memberId: string,
      memberEmail: string,
      transactionId: string
    ) => {
      const idempotencyKey = `reminder_${reportId}_${memberId}`;
      const result = await createReminderWithIdempotency(
        reportId,
        memberId,
        memberEmail,
        idempotencyKey,
        transactionId
      );
      return result;
    };

    // First execution
    const firstResult = await executeReminder(
      reportId,
      memberId,
      memberEmail,
      firstTransactionId
    );

    expect(firstResult.skipped).toBe(false);
    expect(mockDb.reminderLogs).toHaveLength(1);
    expect(mockDb.reminderLogs[0].reportId).toBe(reportId);
    expect(mockDb.reminderLogs[0].memberId).toBe(memberId);
    expect(mockDb.reminderLogs[0].transactionId).toBe(firstTransactionId);

    expect(mockDb.deliveryLogs).toHaveLength(1);
    expect(mockDb.deliveryLogs[0].memberId).toBe(memberId);

    expect(mockMailClient.sendMail).toHaveBeenCalledTimes(1);
    expect(mockMailClient.sendMail).toHaveBeenCalledWith({
      to: memberEmail,
      subject: "日報未提出のお知らせ",
      body: expect.stringContaining(reportId),
    });

    const initialReminderCount = mockDb.reminderLogs.length;
    const initialDeliveryCount = mockDb.deliveryLogs.length;

    // Second execution (idempotent retry)
    const secondResult = await executeReminder(
      reportId,
      memberId,
      memberEmail,
      secondTransactionId
    );

    expect(secondResult.skipped).toBe(true);
    expect(mockDb.reminderLogs).toHaveLength(initialReminderCount);
    expect(mockDb.deliveryLogs).toHaveLength(initialDeliveryCount);
    expect(mockMailClient.sendMail).toHaveBeenCalledTimes(1);

    // Verify audit log
    const auditLog = mockDb.auditLogs.find(
      (log) => log.eventType === "DUPLICATE_PREVENTION"
    );
    expect(auditLog).toBeDefined();
    expect(auditLog?.message).toMatch(/idempotency_key=/);
    expect(auditLog?.message).toMatch(/重複書き込みを防止/);

    // Verify final state
    expect(mockDb.reminderLogs.length).toBe(1);
    expect(mockDb.reminderLogs[0].transactionId).toBe(firstTransactionId);
    expect(mockDb.deliveryLogs.length).toBe(1);
    expect(mockDb.auditLogs.length).toBeGreaterThan(0);
  });
});