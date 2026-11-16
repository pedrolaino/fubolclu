"use client";

// Tabs for one panel whose content changes: arrow keys move between them and only the
// selected one is in the tab order.
export function Tabs({
  items,
  current,
  onSelect,
  panelId,
  className = "",
}: {
  items: { key: string; label: string }[];
  current: string;
  onSelect: (key: string) => void;
  panelId: string;
  className?: string;
}) {
  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const last = items.length - 1;
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % items.length
        : event.key === "ArrowLeft"
          ? (index + last) % items.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    onSelect(items[next].key);
    document.getElementById(tabId(panelId, items[next].key))?.focus();
  }

  return (
    <div role="tablist" className={`display flex flex-wrap gap-y-2 ${className}`}>
      {items.map((item, i) => (
        <button
          key={item.key}
          id={tabId(panelId, item.key)}
          role="tab"
          aria-selected={item.key === current}
          aria-controls={panelId}
          tabIndex={item.key === current ? 0 : -1}
          onClick={() => onSelect(item.key)}
          onKeyDown={(event) => onKeyDown(event, i)}
          className="display cursor-pointer text-2xl text-faint aria-selected:text-ink aria-selected:shadow-[inset_0_-0.16em_var(--lead)] wide:text-3xl"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

// The panel points back at its tab with aria-labelledby.
export const tabId = (panelId: string, key: string) => `${panelId}-tab-${key}`;
