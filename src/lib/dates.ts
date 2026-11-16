const timeZone = "America/Argentina/Buenos_Aires";

const day = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone,
});
const time = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone,
});

// "domingo 22 de noviembre"
export const dayLabel = (date: Date) => day.format(date).replace(",", "");

// "18:00"
export const timeLabel = (date: Date) => time.format(date);

const dayOfMonth = new Intl.DateTimeFormat("es-AR", { day: "numeric", timeZone });
const dayAndMonth = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", timeZone });

// "domingo 22 de noviembre", or "del 5 al 8 de noviembre" when the dates differ.
export function rangeLabel(from: Date, to: Date) {
  if (dayAndMonth.format(from) === dayAndMonth.format(to)) return dayLabel(from);
  const sameMonth =
    dayAndMonth.format(from).split(" de ")[1] === dayAndMonth.format(to).split(" de ")[1];
  return `del ${(sameMonth ? dayOfMonth : dayAndMonth).format(from)} al ${dayAndMonth.format(to)}`;
}
