import { CircleDot, Clock3, Dices, Footprints, LogIn, LogOut } from "lucide-react";
import type { GameEventItem } from "../gameTypes";

type GameEventLogProps = {
  events: GameEventItem[];
};

function EventIcon({ type }: { type: string }) {
  if (type === "dice_rolled") return <Dices size={16} />;
  if (type === "checker_moved" || type === "turn_passed") return <Footprints size={16} />;
  if (type === "player_joined" || type === "room_created") return <LogIn size={16} />;
  if (type === "player_resigned") return <LogOut size={16} />;
  if (type === "turn_timed_out") return <Clock3 size={16} />;
  if (type === "vote_cast" || type === "matchup_decided") return <CircleDot size={16} />;
  return <CircleDot size={16} />;
}

function eventTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function GameEventLog({ events }: GameEventLogProps) {
  return (
    <section className="game-event-log" aria-labelledby="game-event-log-title">
      <header>
        <div>
          <p className="section-kicker">Maç akışı</p>
          <h2 id="game-event-log-title">Son hareketler</h2>
        </div>
        <span>{events.length ? `${events.length} kayıt` : "Henüz sakin"}</span>
      </header>
      {events.length ? (
        <ol>
          {events.map((event) => (
            <li key={event.id}>
              <span className="game-event-icon" aria-hidden="true"><EventIcon type={event.eventType} /></span>
              <p>{event.summary}</p>
              <time dateTime={event.createdAt}>{eventTime(event.createdAt)}</time>
            </li>
          ))}
        </ol>
      ) : (
        <p className="game-event-empty">İlk zar veya oyuncu katılımı burada görünecek.</p>
      )}
    </section>
  );
}
