import { test, expect } from '@playwright/test'
import { launchApp, closeApp } from './helpers'

test.describe('App Launch', () => {
  test('app launches and main window is visible', async () => {
    const { app, page } = await launchApp()

    try {
      const title = await page.title()
      expect(title).toBeTruthy()

      // Window should be visible — check that body is non-empty
      const body = await page.locator('body').boundingBox()
      expect(body).not.toBeNull()
      expect(body!.width).toBeGreaterThan(0)
      expect(body!.height).toBeGreaterThan(0)
    } finally {
      await closeApp(app)
    }
  })

  test('window has expected minimum dimensions', async () => {
    const { app, page } = await launchApp()

    try {
      const windowBounds = await app.evaluate(({ BrowserWindow }) => {
        const win = BrowserWindow.getAllWindows()[0]
        return win.getBounds()
      })

      expect(windowBounds.width).toBeGreaterThanOrEqual(600)
      expect(windowBounds.height).toBeGreaterThanOrEqual(600)
    } finally {
      await closeApp(app)
    }
  })

  test('no unhandled console errors on launch', async () => {
    const { app, page } = await launchApp()
    const errors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    // Wait a short moment for any async errors
    await page.waitForTimeout(1000)

    try {
      expect(errors).toHaveLength(0)
    } finally {
      await closeApp(app)
    }
  })

  test('app title contains "Sudoku"', async () => {
    const { app, page } = await launchApp()

    try {
      const title = await page.title()
      expect(title.toLowerCase()).toContain('sudoku')
    } finally {
      await closeApp(app)
    }
  })

  test('window.api is exposed via contextBridge', async () => {
    const { app, page } = await launchApp()

    try {
      const hasApi = await page.evaluate(() => {
        return (
          typeof (window as unknown as { api?: unknown }).api === 'object' &&
          (window as unknown as { api?: unknown }).api !== null
        )
      })
      expect(hasApi).toBe(true)
    } finally {
      await closeApp(app)
    }
  })

  test('window.api.game has required methods', async () => {
    const { app, page } = await launchApp()

    try {
      const methods = await page.evaluate(() => {
        const api = (window as unknown as { api: { game: Record<string, unknown> } }).api
        return {
          hasNew: typeof api.game.new === 'function',
          hasValidate: typeof api.game.validate === 'function',
          hasSave: typeof api.game.save === 'function',
          hasLoad: typeof api.game.load === 'function',
        }
      })
      expect(methods.hasNew).toBe(true)
      expect(methods.hasValidate).toBe(true)
      expect(methods.hasSave).toBe(true)
      expect(methods.hasLoad).toBe(true)
    } finally {
      await closeApp(app)
    }
  })
})
