"use client";

import React, { useEffect, useMemo, useState } from "react";
import X from "../components/game/X";
import O from "../components/game/O";
import PlayerO from "@/components/game/player/PlayerO";
import PlayerX from "@/components/game/player/PlayerX";
import { AiOutlineReload, AiOutlineSound } from "react-icons/ai";
import { IconContext } from "react-icons";
import { motion } from "framer-motion";

type PlayerProfile = {
  playerId: string;
  name: string;
  wins: number;
  losses: number;
  draws: number;
};

type RoomPlayer = {
  playerId: string;
  name: string;
  symbol: "X" | "O";
  wins: number;
  losses: number;
  draws: number;
};

type RoomState = {
  code: string;
  name: string;
  isPublic: boolean;
  board: Array<"X" | "O" | null>;
  turn: "X" | "O";
  status: "waiting" | "playing" | "finished";
  winner: "X" | "O" | "draw" | null;
  playersCount: number;
  players: RoomPlayer[];
};

type RoomPayload = {
  room: RoomState;
  yourSymbol: "X" | "O" | null;
  you: PlayerProfile | null;
};

type TicTacToeProps = {
  roomCode: string;
  player: PlayerProfile;
  onLeave: (player: PlayerProfile) => void;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_TTT_API_BASE_URL || "http://localhost:4000";

const buttonVariants = {
  initial: { boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.1)" },
  hover: { scale: 1.1, boxShadow: "0px 0px 15px rgba(0, 0, 0, 0.2)" },
  pressed: { scale: 0.9, boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.2)" },
};

const TicTacToe: React.FC<TicTacToeProps> = ({ roomCode, player, onLeave }) => {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [yourSymbol, setYourSymbol] = useState<"X" | "O" | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [message, setMessage] = useState("");

  const xPlayer = room?.players.find((entry) => entry.symbol === "X") || null;
  const oPlayer = room?.players.find((entry) => entry.symbol === "O") || null;

  const status = useMemo(() => {
    if (!room) {
      return "Loading room...";
    }

    if (room.status === "waiting") {
      return `Room ${room.code} | Waiting for opponent`;
    }

    if (room.status === "playing") {
      if (yourSymbol && room.turn === yourSymbol) {
        return `Room ${room.code} | Your turn (${yourSymbol})`;
      }
      return `Room ${room.code} | ${room.turn} to move`;
    }

    if (room.winner === "draw") {
      return `Room ${room.code} | Draw`;
    }

    if (room.winner && yourSymbol) {
      return room.winner === yourSymbol
        ? `Room ${room.code} | You win`
        : `Room ${room.code} | You lose`;
    }

    return `Room ${room.code} | Match finished`;
  }, [room, yourSymbol]);

  const canPlayTurn = Boolean(
    room && yourSymbol && room.status === "playing" && room.turn === yourSymbol
  );

  const toggleMute = () => {
    setIsMuted((previous) => !previous);
  };

  const callApi = async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error || "Request failed");
    }

    return payload as T;
  };

  const syncRoom = async () => {
    const payload = await callApi<RoomPayload>(
      `/api/rooms/${encodeURIComponent(roomCode)}?playerId=${encodeURIComponent(player.playerId)}`
    );
    setRoom(payload.room);
    setYourSymbol(payload.yourSymbol);
  };

  const handleMove = async (index: number) => {
    if (!room || !canPlayTurn || room.board[index] !== null) {
      return;
    }

    try {
      const payload = await callApi<RoomPayload>(
        `/api/rooms/${encodeURIComponent(room.code)}/move`,
        {
          method: "POST",
          body: JSON.stringify({
            playerId: player.playerId,
            index,
          }),
        }
      );
      setRoom(payload.room);
      setYourSymbol(payload.yourSymbol);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not make move");
    }
  };

  const handleRematch = async () => {
    if (!room) {
      return;
    }

    try {
      const payload = await callApi<RoomPayload>(
        `/api/rooms/${encodeURIComponent(room.code)}/rematch`,
        {
          method: "POST",
          body: JSON.stringify({ playerId: player.playerId }),
        }
      );
      setRoom(payload.room);
      setYourSymbol(payload.yourSymbol);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not rematch");
    }
  };

  const handleLeave = async () => {
    if (!room) {
      onLeave(player);
      return;
    }

    try {
      const payload = await callApi<RoomPayload>(
        `/api/rooms/${encodeURIComponent(room.code)}/leave`,
        {
          method: "POST",
          body: JSON.stringify({ playerId: player.playerId }),
        }
      );

      onLeave(payload.you || player);
    } catch (_error) {
      onLeave(player);
    }
  };

  useEffect(() => {
    syncRoom().catch(() => {
      setMessage("Could not load room");
    });

    const intervalId = window.setInterval(() => {
      syncRoom().catch(() => {
        // Keep polling silent unless user triggers an action.
      });
    }, 1200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [roomCode, player.playerId]);

  const renderSquare = (index: number): React.JSX.Element => (
    <div className="square" onClick={() => void handleMove(index)}>
      {room?.board[index] === "X" ? <X /> : room?.board[index] === "O" ? <O /> : null}
    </div>
  );

  return (
    <>
      <div>
        <div className="fixed top-10 left-10 flex gap-2 items-center">
          <div className="status">{room ? `${room.name} (${room.code})` : "Loading"}</div>
          <button className="mute" onClick={() => void handleLeave()} type="button">
            Leave
          </button>
        </div>

        <div className="status">{status}</div>
        {message ? <div className="status text-red-500">{message}</div> : null}

        <div className="board">
          <div className="board-row">
            {renderSquare(0)}
            {renderSquare(1)}
            {renderSquare(2)}
          </div>
          <div className="board-row">
            {renderSquare(3)}
            {renderSquare(4)}
            {renderSquare(5)}
          </div>
          <div className="board-row">
            {renderSquare(6)}
            {renderSquare(7)}
            {renderSquare(8)}
          </div>
        </div>

        <div className="fixed flex reset-container">
          <motion.button
            className="reset"
            onClick={() => void handleRematch()}
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="pressed"
            type="button"
          >
            <IconContext.Provider
              value={{ size: "1.5em", style: { marginRight: "5px" } }}
            >
              <AiOutlineReload />
            </IconContext.Provider>
            rematch
          </motion.button>

          <motion.button
            className="mute"
            onClick={toggleMute}
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="pressed"
            type="button"
          >
            <IconContext.Provider
              value={{ size: "1.5em", style: { marginRight: "5px" } }}
            >
              <div className="flex ">
                <AiOutlineSound /> {isMuted ? <p>off</p> : ""}
              </div>
            </IconContext.Provider>
            mute
          </motion.button>
        </div>
      </div>

      <PlayerX
        alias={xPlayer?.name || "Waiting..."}
        picture={`https://robohash.org/${xPlayer?.name || "X"}`}
        wins={xPlayer?.wins || 0}
        losses={xPlayer?.losses || 0}
        draws={xPlayer?.draws || 0}
        mood={room?.winner === "X" ? "Winner" : yourSymbol === "X" ? "You" : "Ready"}
      />
      <PlayerO
        alias={oPlayer?.name || "Waiting..."}
        picture={`https://robohash.org/${oPlayer?.name || "O"}`}
        wins={oPlayer?.wins || 0}
        losses={oPlayer?.losses || 0}
        draws={oPlayer?.draws || 0}
        mood={room?.winner === "O" ? "Winner" : yourSymbol === "O" ? "You" : "Ready"}
      />
      <audio autoPlay={true} muted={isMuted} src="Loli.mp3" />
    </>
  );
};

export type { PlayerProfile };
export default TicTacToe;
