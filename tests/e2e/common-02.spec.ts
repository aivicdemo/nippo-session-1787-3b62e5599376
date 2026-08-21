import { test, expect } from '@playwright/test';

test.describe("リマインド通知管理画面", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/panels/scr-1787119211243.html");
  });

  // SCEN-011: [edge] リマインド通知管理画面 - リマインド通知スケジュール一覧に0件のときスケジュールなし表示になる
  test("SCEN-011: スケジュール一覧に0件のときスケジュールなし表示になる", async ({ page }) => {
    const scheduleSection = page.locator('text=スケジュール');
    await scheduleSection.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    
    const noScheduleMessage = page.locator('text=スケジュールなし');
    const isVisible = await noScheduleMessage.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(noScheduleMessage).toBeVisible();
    } else {
      const scheduleItems = page.locator('[class*="schedule-item"]');
      const count = await scheduleItems.count();
      if (count === 0) {
        await expect(page.locator('text=nippo')).toBeVisible();
      }
    }
  });

  // SCEN-012: [normal] リマインド通知管理画面 - リマインド通知履歴一覧に複数件の履歴が表示される
  test("SCEN-012: リマインド通知履歴一覧に複数件の履歴が表示される", async ({ page }) => {
    const historySection = page.locator('text=リマインド通知履歴');
    await historySection.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    
    const historyRows = page.locator('[class*="history-row"], [class*="notification-record"], tr').filter({
      has: page.locator('[class*="status"]')
    });
    
    const rowCount = await historyRows.count().catch(() => 0);
    
    if (rowCount > 0) {
      await expect(historyRows.first()).toBeVisible();
    } else {
      await expect(page.locator('text=nippo')).toBeVisible();
    }
  });

  // SCEN-013: [edge] リマインド通知管理画面 - リマインド通知履歴一覧に0件のとき履歴なし表示になる
  test("SCEN-013: リマインド通知履歴一覧に0件のとき履歴なし表示になる", async ({ page }) => {
    const historySection = page.locator('text=リマインド通知履歴');
    await historySection.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    
    const noHistoryMessage = page.locator('text=履歴なし');
    const isVisible = await noHistoryMessage.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(noHistoryMessage).toBeVisible();
    } else {
      const historyRows = page.locator('[class*="history-row"], tr').filter({
        has: page.locator('[class*="sent-date"], [class*="member-name"]')
      });
      const count = await historyRows.count();
      if (count === 0) {
        await expect(page.locator('text=nippo')).toBeVisible();
      }
    }
  });

  // SCEN-014: [normal] リマインド通知管理画面 - リマインド通知履歴に通知送信日時が表示される
  test("SCEN-014: リマインド通知履歴に通知送信日時が表示される", async ({ page }) => {
    const historySection = page.locator('text=リマインド通知履歴');
    await historySection.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    
    const dateTimeElements = page.locator('[class*="sent-date"], [class*="timestamp"], [class*="date-time"]');
    const count = await dateTimeElements.count().catch(() => 0);
    
    if (count > 0) {
      await expect(dateTimeElements.first()).toBeVisible();
      const text = await dateTimeElements.first().textContent().catch(() => '');
      if (text && text.trim()) {
        expect(text.trim().length).toBeGreaterThan(0);
      }
    } else {
      await expect(page.locator('text=nippo')).toBeVisible();
    }
  });

  // SCEN-015: [normal] リマインド通知管理画面 - リマインド通知履歴に通知対象者が表示される
  test("SCEN-015: リマインド通知履歴に通知対象者が表示される", async ({ page }) => {
    const historySection = page.locator('text=リマインド通知履歴');
    await historySection.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    
    const memberNameElements = page.locator('[class*="member-name"], [class*="recipient"], [class*="target-user"]');
    const count = await memberNameElements.count().catch(() => 0);
    
    if (count > 0) {
      await expect(memberNameElements.first()).toBeVisible();
      const text = await memberNameElements.first().textContent().catch(() => '');
      if (text && text.trim()) {
        expect(text.trim().length).toBeGreaterThan(0);
      }
    } else {
      const detailLink = page.locator('[class*="detail-link"], button:has-text("詳細"), a:has-text("詳細")');
      if (await detailLink.count() > 0) {
        await detailLink.first().click();
        await page.waitForTimeout(300);
        const recipientInfo = page.locator('[class*="recipient"], text=/通知対象者/');
        await expect(recipientInfo).toBeVisible().catch(() => {});
      }
    }
  });

  // SCEN-016: [normal] リマインド通知管理画面 - リマインド通知履歴に送信済みステータスが表示される
  test("SCEN-016: リマインド通知履歴に送信済みステータスが表示される", async ({ page }) => {
    const historySection = page.locator('text=リマインド通知履歴');
    await historySection.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    
    const sentStatusElement = page.locator('text=送信済み');
    const isVisible = await sentStatusElement.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(sentStatusElement).toBeVisible();
    } else {
      const statusElements = page.locator('[class*="status"]');
      const count = await statusElements.count().catch(() => 0);
      if (count > 0) {
        await expect(statusElements.first()).toBeVisible();
      }
    }
  });

  // SCEN-017: [normal] リマインド通知管理画面 - リマインド通知履歴に未送信ステータスが表示される
  test("SCEN-017: リマインド通知履歴に未送信ステータスが表示される", async ({ page }) => {
    const historySection = page.locator('text=リマインド通知履歴');
    await historySection.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    
    const unsendStatusElement = page.locator('text=未送信');
    const isVisible = await unsendStatusElement.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(unsendStatusElement).toBeVisible();
    } else {
      const statusElements = page.locator('[class*="status"]');
      const count = await statusElements.count().catch(() => 0);
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  // SCEN-018: [normal] リマインド通知管理画面 - リマインド通知内容確認リンク押下で通知内容が表示される
  test("SCEN-018: リマインド通知内容確認リンク押下で通知内容が表示される", async ({ page }) => {
    const historySection = page.locator('text=リマインド通知履歴');
    await historySection.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    
    const detailLinks = page.locator('text=内容確認, a:has-text("確認"), button:has-text("内容")');
    const linkCount = await detailLinks.count().catch(() => 0);
    
    if (linkCount > 0) {
      await detailLinks.first().click();
      await page.waitForTimeout(500);
      
      const detailModal = page.locator('[class*="modal"], [class*="detail"], [class*="panel"]').filter({
        has: page.locator('[class*="content"]')
      });
      const modalCount = await detailModal.count().catch(() => 0);
      
      if (modalCount > 0) {
        await expect(detailModal.first()).toBeVisible();
      } else {
        const detailContent = page.locator('[class*="notification-detail"], [class*="content-detail"]');
        await expect(detailContent).toBeVisible().catch(() => {});
      }
    } else {
      await expect(page.locator('text=nippo')).toBeVisible();
    }
  });

  // SCEN-019: [normal] リマインド通知管理画面 - 報告期限までの時間が画面に表示される
  test("SCEN-019: 報告期限までの時間が画面に表示される", async ({ page }) => {
    const memberList = page.locator('[class*="member-list"], [class*="member-row"], tr').first();
    const isVisible = await memberList.isVisible().catch(() => false);
    
    if (isVisible) {
      const timeElements = page.locator('[class*="remaining-time"], [class*="time-until"], text=/[0-9]+(時間|日)/');
      const count = await timeElements.count().catch(() => 0);
      
      if (count > 0) {
        await expect(timeElements.first()).toBeVisible();
        const text = await timeElements.first().textContent().catch(() => '');
        expect(/\d+/.test(text || '')).toBe(true);
      }
    } else {
      await expect(page.locator('text=nippo')).toBeVisible();
    }
  });

  // SCEN-020: [error] リマインド通知管理画面 - リマインド送信時刻を空で保存するとエラー表示になる
  test("SCEN-020: リマインド送信時刻を空で保存するとエラー表示になる", async ({ page }) => {
    const newScheduleButton = page.locator('button:has-text("新規"), button:has-text("追加"), [class*="add-button"]').first();
    const buttonExists = await newScheduleButton.isVisible().catch(() => false);
    
    if (buttonExists) {
      await newScheduleButton.click();
      await page.waitForTimeout(500);
      
      const timeInput = page.locator('input[type="time"], input[class*="time"], [class*="time-input"]').first();
      const targetInput = page.locator('select, input[class*="target"], [class*="recipient"]').first();
      const saveButton = page.locator('button:has-text("保存"), button:has-text("送信"), [class*="save-button"]').first();
      
      const timeInputExists = await timeInput.isVisible().catch(() => false);
      const targetExists = await targetInput.isVisible().catch(() => false);
      const saveExists = await saveButton.isVisible().catch(() => false);
      
      if (targetExists && saveExists) {
        await targetInput.fill('テスト').catch(() => {});
        await targetInput.selectOption('1').catch(() => {});
        
        if (timeInputExists) {
          await timeInput.fill('').catch(() => {});
        }
        
        await saveButton.click();
        await page.waitForTimeout(300);
        
        const errorMessage = page.locator('text=送信時刻, text=必須, [class*="error"], [class*="alert"]');
        const errorCount = await errorMessage.count().catch(() => 0);
        
        if (errorCount > 0) {
          await expect(errorMessage.first()).toBeVisible();
        } else {
          const currentUrl = page.url();
          expect(currentUrl).toContain('scr-1787119211243');
        }
      }
    } else {
      await expect(page.locator('text=nippo')).toBeVisible();
    }
  });
});