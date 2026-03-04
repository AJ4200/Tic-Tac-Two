"use client";

import React, { useEffect, useState } from "react";
import classnames from "classnames";
import { motion } from "framer-motion";
import { IconContext } from "react-icons";
import { AiFillGithub, AiFillLinkedin } from "react-icons/ai";
import TicTacToe, { PlayerProfile } from "./TicTacToe";

type PublicRoom = {
  code: string;
  name: string;
  status: "waiting" | "playing" | "finished";
  playersCount: number;
  isPublic: boolean;
};

type RoomPayload = {
  room: {
    code: string;
  };
  you: PlayerProfile | null;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_TTT_API_BASE_URL || "http://localhost:4000";

export default function Home() {
  const [playerName, setPlayerName] = useState("Player");
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [roomName, setRoomName] = useState("My Room");
  const [joinCode, setJoinCode] = useState("");
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  const refreshPublicRooms = async () => {
    try {
      const payload = await callApi<{ rooms: PublicRoom[] }>("/api/rooms/public");
      setPublicRooms(payload.rooms);
    } catch (_error) {
      setPublicRooms([]);
    }
  };

  const ensurePlayer = async () => {
    const savedPlayerId = window.localStorage.getItem("ttt_player_id");
    const payload = await callApi<PlayerProfile>("/api/players/register", {
      method: "POST",
      body: JSON.stringify({
        playerId: savedPlayerId,
        name: playerName,
      }),
    });

    setPlayer(payload);
    window.localStorage.setItem("ttt_player_id", payload.playerId);
    window.localStorage.setItem("ttt_player_name", payload.name);
    return payload;
  };

  const createRoom = async (isPublic: boolean) => {
    try {
      setIsLoading(true);
      const registeredPlayer = await ensurePlayer();

      const payload = await callApi<RoomPayload>("/api/rooms", {
        method: "POST",
        body: JSON.stringify({
          playerId: registeredPlayer.playerId,
          roomName,
          isPublic,
        }),
      });

      if (payload.you) {
        setPlayer(payload.you);
      }
      setActiveRoomCode(payload.room.code);
      setMessage("");
      await refreshPublicRooms();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create room");
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = async (code: string) => {
    const roomCode = code.trim().toUpperCase();
    if (!roomCode) {
      setMessage("Room code is required");
      return;
    }

    try {
      setIsLoading(true);
      const registeredPlayer = await ensurePlayer();

      const payload = await callApi<RoomPayload>("/api/rooms/join", {
        method: "POST",
        body: JSON.stringify({
          playerId: registeredPlayer.playerId,
          code: roomCode,
        }),
      });

      if (payload.you) {
        setPlayer(payload.you);
      }
      setActiveRoomCode(payload.room.code);
      setMessage("");
      await refreshPublicRooms();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not join room");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedName = window.localStorage.getItem("ttt_player_name");
    if (savedName) {
      setPlayerName(savedName);
    }

    ensurePlayer().catch(() => {
      // Player registration can be retried from lobby actions.
    });
    refreshPublicRooms().catch(() => {
      // Silent list refresh failure.
    });
  }, []);

  if (activeRoomCode && player) {
    return (
      <main className="flex max-h-screen flex-col items-center justify-between p-24">
        <TicTacToe
          roomCode={activeRoomCode}
          player={player}
          onLeave={(updatedPlayer) => {
            setPlayer(updatedPlayer);
            setActiveRoomCode(null);
            refreshPublicRooms().catch(() => {
              // Silent list refresh failure.
            });
          }}
        />
      </main>
    );
  }

  return (
    <main className="title-screen-root">
      <header className="title-topbar">
        <IconContext.Provider value={{ size: "2rem" }}>
          <div className="flex items-center justify-center space-x-2">
            <motion.a
              whileHover={{ opacity: 0.5, scale: 0.9, cursor: "pointer" }}
              transition={{ duration: 0.4 }}
              whileTap={{ scale: 1.2 }}
              href="https://github.com/AJ4200"
              target="_blank"
              rel="noreferrer"
            >
              <AiFillGithub />
            </motion.a>
            <motion.a
              whileHover={{ opacity: 0.5, scale: 0.9, cursor: "pointer" }}
              transition={{ duration: 0.4 }}
              whileTap={{ scale: 1.2 }}
              href="https://www.linkedin.com/in/abel-majadibodu-5a0583193/"
              target="_blank"
              rel="noreferrer"
            >
              <AiFillLinkedin />
            </motion.a>
          </div>
        </IconContext.Provider>
      </header>

      <section className="title-screen-content">
        <h1>
          <span>Tic-</span>
          <span>Tac</span>
          <span>-Two</span>
        </h1>

        <motion.span
          className="relative bg-transparent text-lg inline-block"
          initial={{ y: 0 }}
          animate={{ y: [10, -10, 10] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          Multiplayer Lobby
        </motion.span>

        <div className="lobby-card mt-8">
          <div className="lobby-row">
            <input
              className="lobby-input"
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              placeholder="your name"
            />
            <button
              className={classnames("lobby-btn", "custome-shadow")}
              type="button"
              onClick={() => {
                ensurePlayer()
                  .then((registeredPlayer) => {
                    setPlayer(registeredPlayer);
                    setMessage("Profile saved");
                  })
                  .catch((error) => {
                    setMessage(error instanceof Error ? error.message : "Could not save profile");
                  });
              }}
            >
              Save Name
            </button>
          </div>

          <div className="lobby-row">
            <input
              className="lobby-input"
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              placeholder="room name"
            />
            <button
              className={classnames("lobby-btn", "custome-shadow")}
              type="button"
              disabled={isLoading}
              onClick={() => void createRoom(true)}
            >
              Create Public
            </button>
            <button
              className={classnames("lobby-btn", "custome-shadow")}
              type="button"
              disabled={isLoading}
              onClick={() => void createRoom(false)}
            >
              Create Private
            </button>
          </div>

          <div className="lobby-row">
            <input
              className="lobby-input"
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="private room code"
            />
            <button
              className={classnames("lobby-btn", "custome-shadow")}
              type="button"
              disabled={isLoading}
              onClick={() => void joinRoom(joinCode)}
            >
              Join by Code
            </button>
            <button
              className={classnames("lobby-btn", "custome-shadow")}
              type="button"
              onClick={() => {
                refreshPublicRooms().catch(() => {
                  setMessage("Could not refresh public rooms");
                });
              }}
            >
              Refresh List
            </button>
          </div>

          <div className="public-rooms">
            <h2>Public Rooms</h2>
            {publicRooms.length === 0 ? (
              <p>No public rooms yet.</p>
            ) : (
              publicRooms.map((roomItem) => (
                <div key={roomItem.code} className="public-room-item">
                  <div>
                    <p>{roomItem.name}</p>
                    <p>
                      {roomItem.code} | {roomItem.status} | {roomItem.playersCount}/2 players
                    </p>
                  </div>
                  <button
                    className={classnames("lobby-btn", "custome-shadow")}
                    type="button"
                    disabled={isLoading}
                    onClick={() => void joinRoom(roomItem.code)}
                  >
                    Join
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {message ? <p className="lobby-message">{message}</p> : null}
      </section>

      <span className="fixed bottom-1 text-sm">Project By AJ4200 c 2023</span>
    </main>
  );
}
