import { teamInfo } from "@/config/teams";

// Relative luminance per WCAG, from a #rrggbb colour.
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function paint(teamId: number) {
  const colors = teamInfo[teamId]?.colors ?? ["#000000"];
  const lead = colors.find((c) => c !== "#ffffff") ?? "#000000";
  // Black wins once its contrast against the colour beats white's.
  return { lead, onLead: luminance(lead) > 0.179 ? "#000000" : "#ffffff" };
}
