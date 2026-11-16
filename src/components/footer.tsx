import Link from "next/link";
import { loadSyncedAt } from "@/db/queries";
import { dayLabel, timeLabel } from "@/lib/dates";

export async function Footer() {
  const syncedAt = await loadSyncedAt();
  return (
    <footer className="mx-auto max-w-[1200px] px-4 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3 border-t-2 border-ink pt-5 text-sm">
        <Link href="/" className="display text-[32px]">
          FubolClu
        </Link>
        <div className="grid gap-1 text-mute wide:text-right">
          {syncedAt && (
            <p>
              Datos actualizados el {dayLabel(syncedAt)} a las {timeLabel(syncedAt)}.
            </p>
          )}
          <p>
            <a href="https://highlightly.net" className="underline hover:text-ink">
              Datos de Highlightly
            </a>
            . El{" "}
            <a href="https://github.com/pedrolaino/fubolclu" className="underline hover:text-ink">
              código
            </a>{" "}
            es abierto.
          </p>
        </div>
      </div>
    </footer>
  );
}
