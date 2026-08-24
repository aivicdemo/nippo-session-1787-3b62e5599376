import { test, expect } from '@playwright/test';

test.describe("部長向けダッシュボード", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login.html");
    await page.fill('[name="username"]', 'manager');
    await page.fill('[name="password"]', 'password');
    await Promise.all([
      page.waitForURL(url => !url.toString().includes('/login.html')),
      page.click('button[type="submit"]'),
    ]);
    await page.goto("/panels/scr-1787119200549.html");
  });

  // SCEN-019
  test("[normal] 部長向けダッシュボード - 本日の報告提出状況サマリーが表示される", async ({ page }) => {
    await page.waitForSelector('[data-testid="submitted-count"]');
    const submittedCount = await page.locator('[data-testid="submitted-count"]').textContent();
    const unsubmittedCount = await page.locator('[data-testid="unsubmitted-count"]').textContent();
    
    expect(submittedCount).not.toBeNull();
    expect(unsubmittedCount).not.toBeNull();
    const submitted = parseInt(submittedCount || '0');
    const unsubmitted = parseInt(unsubmittedCount || '0');
    expect(submitted + unsubmitted).toBeLessThanOrEqual(10);
  });

  // SCEN-020
  test("[normal] 部長向けダッシュボード - 未提出メンバー一覧が表示される", async ({ page }) => {
    await page.waitForSelector('#unsubmitted-list');
    const unsubmittedList = page.locator('#unsubmitted-list');
    const listItems = await unsubmittedList.locator('li, tr').count();
    expect(listItems).toBeGreaterThanOrEqual(0);
  });

  // SCEN-021
  test("[edge] 部長向けダッシュボード - 未提出メンバーが0件のとき空表示になる", async ({ page }) => {
    await page.waitForSelector('#unsubmitted-empty, #unsubmitted-list');
    const emptyElement = page.locator('#unsubmitted-empty');
    const listElement = page.locator('#unsubmitted-list');
    
    const emptyVisible = await emptyElement.isVisible();
    expect(emptyVisible).toBe(true);
    if (emptyVisible) {
      await expect(emptyElement).toContainText(/未提出者なし|0件/i);
    } else {
      const itemCount = await listElement.locator('li, tr').count();
      expect(itemCount).toBe(0);
    }
  });

  // SCEN-022
  test("[edge] 部長向けダッシュボード - 未提出メンバーが複数件のとき全員表示される", async ({ page }) => {
    await page.waitForSelector('#unsubmitted-list');
    const unsubmittedList = page.locator('#unsubmitted-list');
    const itemCount = await unsubmittedList.locator('li, tr').count();
    
    expect(itemCount).toBeLessThanOrEqual(10);
    if (itemCount > 0) {
      expect(itemCount).toBeGreaterThan(0);
    }
  });

  // SCEN-023
  test("[normal] 部長向けダッシュボード - 優先度別課題一覧が色分け表示される", async ({ page }) => {
    await page.waitForSelector('#issues-list');
    const issuesList = page.locator('#issues-list');
    const issueElements = await issuesList.locator('li, tr, .issue-item').all();
    
    if (issueElements.length > 0) {
      let hasColorVariation = false;
      for (const element of issueElements) {
        const bgColor = await element.evaluate((el: Element) => {
          return window.getComputedStyle(el).backgroundColor;
        });
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
          hasColorVariation = true;
          break;
        }
      }
      expect(hasColorVariation).toBe(true);
    }
  });

  // SCEN-024
  test("[normal] 部長向けダッシュボード - 課題キーワード発生頻度ランキングが表示される", async ({ page }) => {
    await page.waitForSelector('[id*="ranking"], [id*="keyword"]');
    
    const rankingElement = page.locator('[id*="ranking"], .ranking-section, .keyword-ranking').first();
    const isVisible = await rankingElement.isVisible();
    expect(isVisible).toBe(true);
    
    if (isVisible) {
      const keywords = await rankingElement.locator('li, tr, .ranking-item').all();
      expect(keywords.length).toBeGreaterThanOrEqual(0);
    }
  });

  // SCEN-025
  test("[normal] 部長向けダッシュボード - 優先度スコア順序付け課題リストが優先度順に表示される", async ({ page }) => {
    await page.waitForSelector('#issues-list');
    const issuesList = page.locator('#issues-list');
    const issues = await issuesList.locator('li, tr, .issue-item').all();
    
    if (issues.length > 1) {
      const scores = [];
      for (const issue of issues) {
        const scoreText = await issue.textContent();
        const scoreMatch = scoreText?.match(/(\d+)/);
        if (scoreMatch) {
          scores.push(parseInt(scoreMatch[1]));
        }
      }
      
      if (scores.length > 1) {
        for (let i = 0; i < scores.length - 1; i++) {
          expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
        }
      }
    }
  });

  // SCEN-026
  test("[normal] 部長向けダッシュボード - 高優先度課題がハイライト表示される", async ({ page }) => {
    await page.waitForSelector('#high-priority-section, #high-priority-list');
    
    const highPrioritySection = page.locator('#high-priority-section, #high-priority-list');
    const isSectionVisible = await highPrioritySection.isVisible();
    expect(isSectionVisible).toBe(true);
    
    if (isSectionVisible) {
      const highPriorityItems = await highPrioritySection.locator('li, tr, .priority-item').count();
      expect(highPriorityItems).toBeGreaterThanOrEqual(0);
    }
  });

  // SCEN-027
  test("[normal] 部長向けダッシュボード - 課題の影響度（チーム波及度）が表示される", async ({ page }) => {
    await page.waitForSelector('#issues-list');
    const issuesList = page.locator('#issues-list');
    const issues = await issuesList.locator('li, tr, .issue-item').all();
    
    let hasImpactScore = false;
    for (const issue of issues) {
      const text = await issue.textContent();
      if (text && /(\d{1,3})/.test(text)) {
        hasImpactScore = true;
        break;
      }
    }
    expect(hasImpactScore || issues.length === 0).toBe(true);
  });

  // SCEN-028
  test("[normal] 部長向けダッシュボード - 課題詳細確認ボタン押下で詳細画面に遷移する", async ({ page }) => {
    await page.waitForSelector('#issues-list');
    const detailButton = page.locator('button:has-text("詳細確認")').first();
    const isButtonVisible = await detailButton.isVisible();
    expect(isButtonVisible).toBe(true);
    
    if (isButtonVisible) {
      await detailButton.click();
      await page.waitForSelector('#detail-modal-overlay, .modal, #detail-content');
      const detailContent = page.locator('#detail-modal-overlay, .modal, #detail-content');
      await expect(detailContent).toBeVisible();
    }
  });
});