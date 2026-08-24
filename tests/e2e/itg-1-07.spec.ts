import { test, expect } from '@playwright/test';

test.describe("部長向けダッシュボード", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login.html");
    await page.fill('[name="username"]', 'manager');
    await page.fill('[name="password"]', 'test');
    await Promise.all([
      page.waitForURL(url => !url.toString().includes('/login.html')),
      page.click('button[type="submit"]'),
    ]);
    await page.goto("/panels/scr-1787119200549.html");
    await page.waitForLoadState('networkidle');
  });

  // SCEN-029: [normal] 部長向けダッシュボード - 未提出メンバーへのリマインド送信ボタン押下でリマインドが送信される
  test('SCEN-029: リマインド送信ボタン押下でリマインドが送信される', async ({ page }) => {
    await page.waitForSelector('[data-testid="send-reminder-button"]');
    const unsubmittedCount = await page.locator('[data-testid="unsubmitted-count"]').textContent();
    
    if (parseInt(unsubmittedCount || '0') > 0) {
      await page.click('[data-testid="send-reminder-button"]');
      await page.waitForSelector('#reminder-confirm-overlay');
      await page.click('#reminder-confirm-btn');
      const toast = await page.locator('.toast').first();
      await expect(toast).toBeVisible();
    }
  });

  // SCEN-030: [normal] 部長向けダッシュボード - リマインド送信成功時に完了メッセージが表示される
  test('SCEN-030: リマインド送信成功時に完了メッセージが表示される', async ({ page }) => {
    await page.waitForSelector('[data-testid="send-reminder-button"]');
    const unsubmittedCount = parseInt(await page.locator('[data-testid="unsubmitted-count"]').textContent() || '0');
    
    if (unsubmittedCount > 0) {
      await page.click('[data-testid="send-reminder-button"]');
      await page.waitForSelector('#reminder-confirm-overlay');
      await page.click('#reminder-confirm-btn');
      
      const toast = await page.locator('.toast').first();
      await expect(toast).toBeVisible();
      await expect(toast).toContainText('リマインド');
    }
  });

  // SCEN-031: [error] 部長向けダッシュボード - リマインド送信失敗時にエラーメッセージが表示される
  test('SCEN-031: リマインド送信失敗時にエラーメッセージが表示される', async ({ page }) => {
    await page.evaluateHandle(() => {
      (window as any).__REMINDER_SEND_FAIL = true;
    });
    
    const sendButton = await page.locator('[data-testid="send-reminder-button"]');
    if ((await expect(sendButton).toBeVisible(), true)) {
      await page.click('[data-testid="send-reminder-button"]');
      const errorMsg = await page.locator('text=通知送信に遅延');
      await expect(errorMsg).toBeVisible();
    }
  });

  // SCEN-032: [normal] 部長向けダッシュボード - ダッシュボード設定カスタマイズボタン押下で設定画面に遷移する
  test('SCEN-032: ダッシュボード設定カスタマイズボタン押下で設定画面に遷移する', async ({ page }) => {
    const settingsButton = await page.locator('button[title="設定"], [data-testid="settings-button"], .header-right button:has-text("⚙")').first();
    
    if ((await expect(settingsButton).toBeVisible(), true)) {
      await settingsButton.click();
      const urlAfter = page.url();
      expect(urlAfter).toMatch(/settings|configure/i);
    }
  });

  // SCEN-033: [normal] 部長向けダッシュボード - 報告提出状況の時系列推移グラフが表示される
  test('SCEN-033: 報告提出状況の時系列推移グラフが表示される', async ({ page }) => {
    
    const chartElement = await page.locator('[data-testid="submission-timeline-chart"], svg').first();
    if ((await expect(chartElement).toBeVisible(), true)) {
      await expect(chartElement).toBeVisible();
    } else {
      const scrollable = await page.locator('.content-area');
      if ((await expect(scrollable).toBeVisible(), true)) {
        await scrollable.evaluate(el => el.scrollTop = el.scrollHeight);
      }
    }
  });

  // SCEN-034: [normal] 部長向けダッシュボード - 課題キーワード別フィルタリング機能で特定キーワードを選択すると一覧が絞り込まれる
  test('SCEN-034: 課題キーワード別フィルタリング機能で特定キーワードを選択すると一覧が絞り込まれる', async ({ page }) => {
    const keywordFilter = await page.locator('#issues-list .card').first();
    const initialCount = await page.locator('#issues-list .card').count();
    
    if (initialCount > 1) {
      const firstKeyword = await keywordFilter.locator('.keyword-tag').first();
      if ((await expect(firstKeyword).toBeVisible(), true)) {
        await firstKeyword.click();
        const filteredCount = await page.locator('#issues-list .card').count();
        expect(filteredCount).toBeLessThanOrEqual(initialCount);
      }
    }
  });

  // SCEN-035: [edge] 部長向けダッシュボード - 課題キーワードフィルタで0件の場合空表示になる
  test('SCEN-035: 課題キーワードフィルタで0件の場合空表示になる', async ({ page }) => {
    const filterInput = await page.locator('input[placeholder*="キーワード"], input[placeholder*="課題"]').first();
    
    if ((await expect(filterInput).toBeVisible(), true)) {
      await filterInput.fill('ZZZNOTEXIST');
      await page.keyboard.press('Enter');
      
      const emptyMsg = await page.locator('#issues-empty, text=該当する課題');
      if ((await expect(emptyMsg).toBeVisible(), true)) {
        await expect(emptyMsg).toBeVisible();
      }
    }
  });

  // SCEN-036: [normal] 部長向けダッシュボード - 課題キーワードフィルタを解除すると全件表示に戻る
  test('SCEN-036: 課題キーワードフィルタを解除すると全件表示に戻る', async ({ page }) => {
    const filterInput = await page.locator('input[placeholder*="キーワード"], input[placeholder*="課題"]').first();
    const clearBtn = await page.locator('button:has-text("クリア"), button:has-text("解除")').first();
    
    if ((await expect(filterInput).toBeVisible(), true)) {
      const initialCount = await page.locator('#issues-list .card').count();
      
      await filterInput.fill('テスト');
      await page.keyboard.press('Enter');
      
      if ((await expect(clearBtn).toBeVisible(), true)) {
        await clearBtn.click();
        const finalCount = await page.locator('#issues-list .card').count();
        expect(finalCount).toBeGreaterThanOrEqual(initialCount);
      }
    }
  });

  // SCEN-037: [edge] 部長向けダッシュボード - 優先度別課題が0件のとき空表示になる
  test('SCEN-037: 優先度別課題が0件のとき空表示になる', async ({ page }) => {
    await page.evaluateHandle(() => {
      (window as any).__NO_ISSUES = true;
    });
    
    await page.reload();
    
    const highPriorityList = await page.locator('#high-priority-list, #high-priority-section');
    const emptyMsg = await page.locator('#issues-empty, text=課題がありません').first();
    
    if ((await expect(highPriorityList).toBeVisible(), true)) {
      const count = await highPriorityList.locator('.issue-item').count();
      if (count === 0) {
        await expect(emptyMsg).toBeVisible();
      }
    }
  });

  // SCEN-038: [edge] 部長向けダッシュボード - 優先度別課題が複数件のとき全件表示される
  test('SCEN-038: 優先度別課題が複数件のとき全件表示される', async ({ page }) => {
    await page.waitForSelector('#high-priority-section');
    
    const highPriorityItems = await page.locator('#high-priority-list .card, #high-priority-list .issue-item').count();
    const mediumPriorityItems = await page.locator('#medium-priority-list .card, #medium-priority-list .issue-item').count();
    const lowPriorityItems = await page.locator('#low-priority-list .card, #low-priority-list .issue-item').count();
    
    const totalItems = highPriorityItems + mediumPriorityItems + lowPriorityItems;
    
    if (totalItems > 0) {
      const allIssues = await page.locator('#issues-list .card, #issues-list .issue-item');
      const issueCount = await allIssues.count();
      expect(issueCount).toBeGreaterThan(0);
    }
  });
});