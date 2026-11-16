import { describe, expect, it, vi } from "vitest";
import { season2025 } from "@/config/seasons/2025";
import { season2026 } from "@/config/seasons/2026";
import detail from "./fixtures/match-detail.json";
import page from "./fixtures/matches-page.json";
import standings from "./fixtures/standings-2026.json";
import {
  parseMatchDetail,
  parseMatchPage,
  parseRound,
  parseStandings,
  parseStatus,
} from "./highlightly";

const [lpf, nacional, copa] = season2026.competitions;
const now = new Date("2026-11-16T01:00:00Z");

describe("parseRound", () => {
  it.each([
    [lpf, "Regular Season - 1", "apertura", "league", 1],
    [lpf, "Apertura - 9", "apertura", "league", 9],
    [lpf, "Apertura - Round of 16", "apertura", "knockout", null],
    [lpf, "Apertura - Final", "apertura", "knockout", null],
    [lpf, "Clausura - 16", "clausura", "league", 16],
    [lpf, "Round of 16", "clausura", "knockout", null],
    [lpf, "Quarter-finals", "clausura", "knockout", null],
    [season2025.competitions[0], "1st Phase - 12", "apertura", "league", 12],
    [season2025.competitions[0], "1st Phase - 8th Finals", "apertura", "knockout", null],
    [season2025.competitions[0], "2nd Phase - 3", "clausura", "league", 3],
    [season2025.competitions[0], "Final", "clausura", "knockout", null],
    [nacional, "Regular Season - 36", null, "league", 36],
    [nacional, "Super Final", null, "knockout", null],
    [copa, "Round of 64", null, "knockout", null],
  ])("%#: %s", (competition, label, tournament, phase, matchday) => {
    expect(parseRound(label, competition.rounds)).toEqual({ tournament, phase, matchday });
  });
});

describe("parseStatus", () => {
  const past = new Date("2026-11-15T23:30:00Z");
  const future = new Date("2026-11-22T21:00:00Z");

  it.each([
    ["Not started", "scheduled"],
    ["Finished", "finished"],
    ["Finished after extra time", "finished"],
    ["Finished after penalties", "finished"],
    ["First half", "live"],
    ["Half time", "live"],
    ["Second half", "live"],
    ["Extra time", "live"],
    ["Penalties", "live"],
    ["Postponed", "postponed"],
    ["Abandoned", "postponed"],
    ["Suspended", "postponed"],
    ["Cancelled", "cancelled"],
  ])("%s -> %s", (description, status) => {
    expect(parseStatus(description, past, now)).toBe(status);
  });

  it("treats unknown descriptions as scheduled before kickoff and keeps the old status after", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(parseStatus("Something new", future, now)).toBe("scheduled");
    expect(parseStatus("Something new", past, now)).toBeNull();
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});

describe("parseMatchPage", () => {
  const result = parseMatchPage(page, lpf, 2026, now);

  it("normalizes matches", () => {
    expect(result.total).toBe(503);
    expect(result.matches).toHaveLength(5);
    expect(result.matches[0]).toEqual({
      id: 1403785705,
      competition: "liga-profesional",
      season: 2026,
      roundLabel: "Round of 16",
      tournament: "clausura",
      phase: "knockout",
      matchday: null,
      kickoff: new Date("2026-11-22T21:00:00.000Z"),
      status: "scheduled",
      homeTeamId: 373522,
      awayTeamId: 375224,
      homeGoals: null,
      awayGoals: null,
      homePenalties: null,
      awayPenalties: null,
    });
  });

  it("reads scores and penalties", () => {
    const semi = result.matches.find((m) => m.id === 1314936199)!;
    expect(semi).toMatchObject({
      status: "finished",
      homeGoals: 1,
      awayGoals: 1,
      homePenalties: 3,
      awayPenalties: 4,
    });
  });

  it("collects each team once", () => {
    expect(result.teams).toHaveLength(9);
    expect(result.teams).toContainEqual({
      id: 375224,
      name: "Belgrano Cordoba",
      logoUrl: "https://highlightly.net/soccer/images/teams/375224.png",
    });
  });
});

describe("parseMatchDetail", () => {
  const { events, stats } = parseMatchDetail(detail);

  it("keeps known event types and drops the rest", () => {
    expect(events.map((e) => e.type)).not.toContain(undefined);
    expect(events).toHaveLength(16);
    expect(events.filter((e) => e.type === "own_goal")).toHaveLength(1);
  });

  it("reads goals with assists", () => {
    expect(events.find((e) => e.type === "goal")).toEqual({
      teamId: 380330,
      playerId: 92890,
      playerName: "Eduardo Salvio",
      assistPlayerId: 1001091,
      assistPlayerName: "Marcelino Moreno",
      type: "goal",
      minute: 41,
      extraMinute: null,
    });
  });

  it("reads stoppage time and players without an id", () => {
    expect(events.find((e) => e.minute === 90 && e.type === "yellow_card")).toMatchObject({
      playerId: null,
      playerName: "Enzo Tiziano Ramirez Suarez",
      extraMinute: 3,
    });
  });

  it("reads the player coming on as the assist of a substitution", () => {
    expect(events.find((e) => e.type === "substitution")).toMatchObject({
      playerName: "Marcelino Moreno",
      assistPlayerId: 94351950,
      assistPlayerName: "Gonzalo Thomás Lobos",
    });
  });

  it("keeps the raw statistics", () => {
    expect(stats).toEqual(detail[0].statistics);
  });
});

describe("parseStandings", () => {
  it("flattens the groups", () => {
    const rows = parseStandings(standings);
    expect(rows).toHaveLength(60);
    expect(rows[0]).toEqual({
      groupName: "Apertura - Group A",
      team: { id: 383734, name: "Estudiantes de La Plata", logoUrl: null },
      position: 1,
      played: 16,
      won: 9,
      drawn: 4,
      lost: 3,
      goalsFor: 19,
      goalsAgainst: 7,
      points: 31,
    });
  });
});
