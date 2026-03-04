"use client";

import React, { useEffect, useMemo, useState } from "react";
import X from "../components/game/X";
import O from "../components/game/O";
import PlayerO from "@/components/game/player/PlayerO";
import PlayerX from "@/components/game/player/PlayerX";
import { AiOutlineReload, AiOutlineSound } from "react-icons/ai";
import { IconContext } from "react-icons";
import { motion } from "framer-motion";

type GameState = {
  board: Array<"X" | "O" | null>;
  turn: "X" | "O";
  status: "waiting" | "playing" | "finished";
  winner: "X" | "O" | "draw" | null;
  playersCount: number;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_TTT_API_BASE_URL || "http://localhost:4000";

const buttonVariants = {
  initial: { boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.1)" },
  hover: { scale: 1.1, boxShadow: "0px 0px 15px rgba(0, 0, 0, 0.2)" },
  pressed: { scale: 0.9, boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.2)" },
};

const EMPTY_STATE: GameState = {
  board: Array(9).fill(null),
  turn: "X",
  status: "waiting",
  winner: null,
  playersCount: 0,
};

const TicTacToe: React.FC = () => {
  const [roomInput, setRoomInput] = useState("main");
  const [room, setRoom] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [symbol, setSymbol] = useState<"X" | "O" | null>(null);
  const [state, setState] = useState<GameState>(EMPTY_STATE);
  const [isMuted, setIsMuted] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const canPlayTurn =
    state.status === "playing" && symbol !== null && state.turn === symbol;

  const status = useMemo(() => {
    if (!room) {
      return "Join a room to start";
    }

    if (state.status === "waiting") {
      return `Room: ${room} | You are ${symbol ?? "?"} | Waiting for opponent`;
    }

    if (state.status === "playing") {
      if (!symbol) {
        return `Room: ${room} | Spectating`;
      }
      return state.turn === symbol
        ? `Room: ${room} | Your turn (${symbol})`
        : `Room: ${room} | Opponent's turn (${state.turn})`;
    }

    if (state.winner === "draw") {
      return `Room: ${room} | Draw`;
    }

    if (state.winner && symbol) {
      return state.winner === symbol
        ? `Room: ${room} | You win`
        : `Room: ${room} | You lose`;
    }

    return `Room: ${room} | Match finished`;
  }, [room, state, symbol]);

  useEffect(() => {
    const savedPlayerId = window.localStorage.getItem("ttt_player_id");
    if (savedPlayerId) {
      setPlayerId(savedPlayerId);
    }
  }, []);

  const callApi = async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });

    const payload = await response.json();
    if (!response.ok) {
      const apiError = payload?.error || "Request failed";
      throw new Error(apiError);
    }
    return payload as T;
  };

  const syncRoomState = async (roomName: string, currentPlayerId: string) => {
    const payload = await callApi<{ symbol: "X" | "O" | null; state: GameState }>(
      `/api/rooms/${encodeURIComponent(roomName)}?playerId=${encodeURIComponent(currentPlayerId)}`
    );
    setSymbol(payload.symbol);
    setState(payload.state);
  };

  const joinRoom = async () => {
    const roomName = roomInput.trim() || "main";

    try {
      setIsLoading(true);
      const payload = await callApi<{
        room: string;
        playerId: string;
        symbol: "X" | "O" | null;
        state: GameState;
      }>("/api/rooms/join", {
        method: "POST",
        body: JSON.stringify({
          room: roomName,
          playerId,
        }),
      });

      setRoom(payload.room);
      setPlayerId(payload.playerId);
      setSymbol(payload.symbol);
      setState(payload.state);
      setMessage("");
      window.localStorage.setItem("ttt_player_id", payload.playerId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not join room");
    } finally {
      setIsLoading(false);
    }
  };

  const leaveRoom = async () => {
    if (!room || !playerId) {
      return;
    }
    try {
      await callApi(`/api/rooms/${encodeURIComponent(room)}/leave`, {
        method: "POST",
        body: JSON.stringify({ playerId }),
      });
    } catch (_error) {
      // Ignore room cleanup errors on leave.
    }
    setRoom(null);
    setSymbol(null);
    setState(EMPTY_STATE);
  };

  const handleClick = async (index: number): Promise<void> => {
    if (!room || !playerId || !canPlayTurn || state.board[index] !== null) {
      return;
    }
    try {
      const payload = await callApi<{ state: GameState }>(
        `/api/rooms/${encodeURIComponent(room)}/move`,
        {
          method: "POST",
          body: JSON.stringify({ playerId, index }),
        }
      );
      setState(payload.state);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not make move");
    }
  };

  const handleReset = async (): Promise<void> => {
    if (!room || !playerId) {
      return;
    }
    try {
      const payload = await callApi<{ state: GameState }>(
        `/api/rooms/${encodeURIComponent(room)}/rematch`,
        {
          method: "POST",
          body: JSON.stringify({ playerId }),
        }
      );
      setState(payload.state);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not rematch");
    }
  };

  useEffect(() => {
    if (!room || !playerId) {
      return undefined;
    }
    const intervalId = window.setInterval(() => {
      syncRoomState(room, playerId).catch(() => {
        // Polling should stay silent; direct actions show errors.
      });
    }, 1200);
    return () => window.clearInterval(intervalId);
  }, [room, playerId]);

  const renderSquare = (index: number): JSX.Element => (
    <div className="square" onClick={() => void handleClick(index)}>
      {state.board[index] === "X" ? <X /> : state.board[index] === "O" ? <O /> : null}
    </div>
  );

  return (
    <>
      <div>
        <div className="fixed top-10 left-10 flex gap-2 items-center">
          <input
            className="text-black px-3 py-2 rounded"
            value={roomInput}
            onChange={(event) => setRoomInput(event.target.value)}
            placeholder="room name"
          />
          <button
            className="reset"
            onClick={() => void joinRoom()}
            disabled={isLoading}
            type="button"
          >
            {isLoading ? "Joining..." : "Join"}
          </button>
          {room ? (
            <button className="mute" onClick={() => void leaveRoom()} type="button">
              Leave
            </button>
          ) : null}
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
            onClick={() => void handleReset()}
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
        alias="PlayerX"
        picture={`https://robohash.org/X`}
        wins={state.winner === "X" ? 1 : 0}
        losses={state.winner === "O" ? 1 : 0}
        draws={state.winner === "draw" ? 1 : 0}
        mood={symbol === "X" ? "You" : "Ready"}
      />
      <PlayerO
        alias="PlayerO"
        picture={`https://robohash.org/O`}
        wins={state.winner === "O" ? 1 : 0}
        losses={state.winner === "X" ? 1 : 0}
        draws={state.winner === "draw" ? 1 : 0}
        mood={symbol === "O" ? "You" : "Ready"}
      />
      <audio autoPlay={true} muted={isMuted} src="Loli.mp3" />
    </>
  );
};

export default TicTacToe;
