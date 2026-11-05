import { applyTheme, type Theme } from "@cloudscape-design/components/theming";

/**
 * Colors sampled from screenshots of the current (2026) AWS Management Console
 * (Amazon ECS / EC2 pages). The console now uses rounded corners, so Cloudscape's
 * own radii are kept. Only light mode is overridden — dark mode keeps the Cloudscape
 * palette because the reference screenshots have no dark variant.
 * The top navigation uses the same dark bar in both modes, as in the console.
 */
export const AWS_CONSOLE_COLORS = {
  squidInk: "#171d24", // top bar + favorites bar
  searchBg: "#10141a", // search input on the top bar
  pageBg: "#ffffff",
  containerBg: "#ffffff",
  containerBorder: "#c6c6cd",
  primary: "#eb9a1f", // primary button (dark text)
  primaryHover: "#d9860b",
  blue: "#376ede", // links, normal buttons, active tab and side-nav item
  blueHover: "#1f55c2",
  text: "#10141a",
  textSecondary: "#434650",
  textNavLabel: "#888d93",
  success: "#427f33",
} as const;

const c = AWS_CONSOLE_COLORS;
const light = (value: string) => ({ light: value });

export const AWS_CONSOLE_THEME: Theme = {
  tokens: {
    fontFamilyBase: '"Amazon Ember", "Helvetica Neue", Roboto, Arial, sans-serif',

    colorBackgroundLayoutMain: light(c.pageBg),
    colorBackgroundContainerContent: light(c.containerBg),
    colorBorderContainerTop: light(c.containerBorder),

    colorTextBodyDefault: light(c.text),
    colorTextHeadingDefault: light(c.text),
    colorTextBodySecondary: light(c.textSecondary),
    colorTextLabel: light(c.text),
    colorTextAccent: light(c.blue),

    colorTextLinkDefault: light(c.blue),
    colorTextLinkHover: light(c.blueHover),
    colorTextInteractiveActive: light(c.blue),

    colorBackgroundButtonPrimaryDefault: light(c.primary),
    colorBackgroundButtonPrimaryHover: light(c.primaryHover),
    colorBackgroundButtonPrimaryActive: light(c.primaryHover),
    colorBorderButtonPrimaryDefault: light(c.primary),
    colorBorderButtonPrimaryHover: light(c.primaryHover),
    colorBorderButtonPrimaryActive: light(c.primaryHover),
    colorTextButtonPrimaryDefault: light(c.text),
    colorTextButtonPrimaryHover: light(c.text),
    colorTextButtonPrimaryActive: light(c.text),

    colorBorderButtonNormalDefault: light(c.blue),
    colorTextButtonNormalDefault: light(c.blue),
    colorBorderButtonNormalHover: light(c.blueHover),
    colorTextButtonNormalHover: light(c.blueHover),

    colorBackgroundNotificationGreen: light(c.success),
    colorTextStatusSuccess: light(c.success),
  },
  contexts: {
    "top-navigation": {
      tokens: {
        colorBackgroundContainerContent: c.squidInk,
        colorBackgroundInputDefault: c.searchBg,
        colorBorderInputDefault: c.textNavLabel,
        colorTextTopNavigationTitle: "#ffffff",
        colorTextInteractiveDefault: "#ffffff",
        colorTextInteractiveHover: "#ff9900",
      },
    },
  },
};

export function applyAwsConsoleTheme() {
  return applyTheme({ theme: AWS_CONSOLE_THEME });
}
