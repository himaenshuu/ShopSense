"use client";

/**
 * Theme Context using next-themes
 *
 * This provides a simplified theme provider using the next-themes library,
 * which handles:
 * - System theme detection
 * - Theme persistence
 * - SSR-safe theme switching
 * - No flash of wrong theme on page load
 *
 * next-themes is the standard solution for Next.js applications
 */

export { ThemeProvider } from "next-themes";
export { useTheme } from "next-themes";

/**
 * Note: The ThemeProvider is now configured in app/layout.tsx with:
 * - attribute="class" (uses class-based dark mode)
 * - defaultTheme="system" (respects OS preference)
 * - enableSystem (allows system theme detection)
 * - disableTransitionOnChange (smooth theme transitions)
 */
