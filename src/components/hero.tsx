"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { TeamView } from "@/lib/league";
import { Crest } from "./crest";

const links = [
  ["/liga-profesional", "Liga Profesional"],
  ["/primera-nacional", "Primera Nacional"],
  ["/copa-argentina", "Copa Argentina"],
  ["/como-se-define", "Cómo se define todo"],
];

export function Hero({
  subject,
  title,
  summary,
  shareCrest = false,
  sticker = true,
}: {
  subject: TeamView;
  title: string;
  summary: string;
  // The sticker is the destination of the crest a table row links from.
  shareCrest?: boolean;
  // Off when the page has no team, like the 404.
  sticker?: boolean;
}) {
  const pathname = usePathname();
  // The colour being wiped over; catches up once the wipe ends.
  const [under, setUnder] = useState(subject.lead);

  return (
    <header
      className="relative text-on-lead"
      style={
        {
          "--lead": subject.lead,
          "--on-lead": subject.onLead,
          background: under,
        } as React.CSSProperties
      }
    >
      <motion.div
        key={subject.lead}
        aria-hidden
        className="absolute inset-0 bg-lead"
        initial={{ clipPath: "inset(0 100% 0 0)" }}
        animate={{ clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.45, ease: [0.3, 0, 0.1, 1] }}
        onAnimationComplete={() => setUnder(subject.lead)}
      />
      <div className="relative mx-auto max-w-[1200px] px-4">
        <nav className="flex h-[60px] items-center gap-7 overflow-x-auto text-[15px] font-semibold whitespace-nowrap">
          <Link href="/" className="display mr-3 text-[30px]">
            FubolClu
          </Link>
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname.startsWith(href) ? "page" : undefined}
              className="flex h-full items-center hover:underline aria-[current]:shadow-[inset_0_-3px_currentColor]"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="grid items-end gap-6 pt-6 wide:grid-cols-[1fr_auto] wide:pt-10">
          <div className="min-w-0">
            <p className="mb-[18px] max-w-[24ch] font-medium wide:max-w-[32ch] wide:text-xl">
              {summary}
            </p>
            <motion.h1
              key={title}
              // Sized so the longest names still fit on one line.
              style={{ "--chars": title.length } as React.CSSProperties}
              className="display -mb-[0.035em] text-[min(13vw,190px,calc((100vw-32px)/var(--chars)/0.44))] tracking-[-0.02em] whitespace-nowrap wide:text-[min(13vw,190px,calc((min(100vw,1200px)-300px)/var(--chars)/0.44))]"
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {title}
            </motion.h1>
          </div>
          {sticker && (
            <motion.div
              key={subject.id}
              className="absolute top-[68px] right-3.5 z-10 wide:static wide:mr-[60px] wide:translate-y-[70px]"
              // A morphing sticker arrives already visible.
              initial={shareCrest ? false : { scale: 1.35, rotate: 20, opacity: 0 }}
              animate={{ scale: 1, rotate: 8, opacity: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.15 }}
            >
              {shareCrest ? (
                // One element at both sizes: a named crest can't be paired with its hidden twin.
                <Crest
                  team={subject}
                  size={190}
                  className="sticker-lg !size-[84px] wide:!size-[190px]"
                  shared
                />
              ) : (
                <>
                  <Crest team={subject} size={84} className="sticker-lg wide:hidden" />
                  <Crest team={subject} size={190} className="sticker-lg hidden wide:block" />
                </>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
}
