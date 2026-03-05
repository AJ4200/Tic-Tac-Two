"use client";

import React, { useEffect, useState } from "react";
import classnames from "classnames";
import { motion } from "framer-motion";
import { IconContext } from "react-icons";
import {
  AiFillGithub,
  AiFillLinkedin,
  AiFillPlayCircle,
  AiFillSetting,
  AiOutlineTrophy,
  AiOutlineArrowLeft,
  AiOutlineLoading3Quarters,
  AiOutlineClockCircle,
  AiOutlinePlayCircle,
  AiOutlineCheckCircle,
  AiOutlineTeam,
} from "react-icons/ai";
import TicTacToe, { PlayerProfile } from "./TicTacToe";

type Screen = "home" | "lobby" | "leaderboard" | "settings" | "game";

type PublicRoom = {
  code: string;
  name: string;
  status: "waiting" | "playing" | "finished";
  playersCount: number;
  isPublic: boolean;
};

type LeaderboardPlayer = PlayerProfile & {
  score: number;
};

type RoomPayload = {
  room: {
    code: string;
  };
  you: PlayerProfile | null;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_TTT_API_BASE_URL || "http://localhost:4000";

const getRandomBrightColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i += 1) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [playerName, setPlayerName] = useState("Player");
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [roomName, setRoomName] = useState("My Room");
  const [joinCode, setJoinCode] = useState("");
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [matchBackgroundColor, setMatchBackgroundColor] = useState("#ffffff");
  const [activeRequests, setActiveRequests] = useState(0);

  const runWithLoader = async <T,>(
    task: () => Promise<T>,
    showLoader = true
  ): Promise<T> => {
    if (showLoader) {
      setActiveRequests((current) => current + 1);
    }
    try {
      return await task();
    } finally {
      if (showLoader) {
        setActiveRequests((current) => Math.max(0, current - 1));
      }
    }
  };

  const callApi = async <T,>(
    path: string,
    init?: RequestInit,
    showLoader = true
  ): Promise<T> => {
    return runWithLoader(async () => {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...init,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Request failed");
      }

      return payload as T;
    }, showLoader);
  };

  const refreshPublicRooms = async () => {
    const payload = await callApi<{ rooms: PublicRoom[] }>("/api/rooms/public");
    setPublicRooms(payload.rooms);
  };

  const refreshLeaderboard = async () => {
    const payload = await callApi<{ players: LeaderboardPlayer[] }>(
      "/api/players/leaderboard"
    );
    setLeaderboard(payload.players);
  };

  const ensurePlayer = async () => {
    const savedPlayerId = window.localStorage.getItem("ttt_player_id");
    const payload = await callApi<PlayerProfile>("/api/players/register", {
      method: "POST",
      body: JSON.stringify({
        playerId: savedPlayerId,
        name: playerName || "Player",
      }),
    });

    setPlayer(payload);
    setPlayerName(payload.name);
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
      setMatchBackgroundColor(getRandomBrightColor());
      setActiveRoomCode(payload.room.code);
      setScreen("game");
      setMessage("");
      await Promise.all([refreshPublicRooms(), refreshLeaderboard()]);
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
      setMatchBackgroundColor(getRandomBrightColor());
      setActiveRoomCode(payload.room.code);
      setScreen("game");
      setMessage("");
      await Promise.all([refreshPublicRooms(), refreshLeaderboard()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not join room");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedName = window.localStorage.getItem("ttt_player_name");
    const savedMuted = window.localStorage.getItem("ttt_music_muted");
    const savedAnimations = window.localStorage.getItem("ttt_enable_animations");

    if (savedName) {
      setPlayerName(savedName);
    }
    if (savedMuted) {
      setIsMusicMuted(savedMuted === "true");
    }
    if (savedAnimations) {
      setEnableAnimations(savedAnimations === "true");
    }

    ensurePlayer().catch(() => {
      // Registration can be retried from UI.
    });
    refreshPublicRooms().catch(() => {
      // Ignore initial lobby load failures.
    });
    refreshLeaderboard().catch(() => {
      // Ignore initial leaderboard load failures.
    });
  }, []);

  const renderTopBar = () => (
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
  );

  const renderHomeScreen = () => (
    <section className="title-screen-content">
      <h1>
        <span>Tic-</span>
        <span>Tac</span>
        <span>-Two</span>
      </h1>

      <motion.div
        className="main-menu"
        animate={enableAnimations ? { y: [6, -6, 6] } : undefined}
        transition={enableAnimations ? { duration: 4, repeat: Infinity } : undefined}
      >
        <button
          className={classnames("main-menu-btn", "custome-shadow")}
          type="button"
          onClick={() => setScreen("lobby")}
        >
          <AiFillPlayCircle /> Play
        </button>
        <button
          className={classnames("main-menu-btn", "custome-shadow")}
          type="button"
          onClick={() => {
            refreshLeaderboard().catch(() => {
              setMessage("Could not load leaderboard");
            });
            setScreen("leaderboard");
          }}
        >
          <AiOutlineTrophy /> Leaderboard
        </button>
        <button
          className={classnames("main-menu-btn", "custome-shadow")}
          type="button"
          onClick={() => setScreen("settings")}
        >
          <AiFillSetting /> Settings
        </button>
      </motion.div>
    </section>
  );

  const renderLobbyScreen = () => (
    <section className="title-screen-content">
      <h1>
        <span>Tic-</span>
        <span>Tac</span>
        <span>-Two</span>
      </h1>

      <div className="lobby-card mt-8">
        <div className="lobby-row">
          <button className="lobby-back" type="button" onClick={() => setScreen("home")}>
            <AiOutlineArrowLeft /> Back
          </button>
        </div>

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
                  <p className="public-room-title">{roomItem.name}</p>
                  <p className="public-room-meta">
                    {roomItem.status === "waiting" ? (
                      <AiOutlineClockCircle />
                    ) : roomItem.status === "playing" ? (
                      <AiOutlinePlayCircle />
                    ) : (
                      <AiOutlineCheckCircle />
                    )}{" "}
                    {roomItem.status} | {roomItem.code} | <AiOutlineTeam />{" "}
                    {roomItem.playersCount}/2 players
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
  );

  const renderLeaderboard = () => (
    <section className="title-screen-content">
      <h1>
        <span>Leader-</span>
        <span>Board</span>
      </h1>

      <div className="lobby-card mt-8">
        <div className="lobby-row">
          <button className="lobby-back" type="button" onClick={() => setScreen("home")}>
            <AiOutlineArrowLeft /> Back
          </button>
          <button
            className={classnames("lobby-btn", "custome-shadow")}
            type="button"
            onClick={() => {
              refreshLeaderboard().catch(() => {
                setMessage("Could not refresh leaderboard");
              });
            }}
          >
            Refresh
          </button>
        </div>

        <div className="leaderboard-list">
          {leaderboard.length === 0 ? (
            <p>No players found yet.</p>
          ) : (
            leaderboard.map((entry, index) => (
              <div key={entry.playerId} className="leaderboard-item">
                <div className="leaderboard-rank">#{index + 1}</div>
                <img
                  src={`https://robohash.org/${entry.name}`}
                  alt={`${entry.name} avatar`}
                  className="leaderboard-avatar"
                />
                <div className="leaderboard-meta">
                  <p>{entry.name}</p>
                  <p>
                    <span className="lb-win">W {entry.wins}</span> |{" "}
                    <span className="lb-loss">L {entry.losses}</span> | D {entry.draws}
                  </p>
                </div>
                <div className="leaderboard-score">{entry.score} pts</div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );

  const renderSettings = () => (
    <section className="title-screen-content">
      <h1>
        <span>Set-</span>
        <span>tings</span>
      </h1>

      <div className="lobby-card mt-8">
        <div className="lobby-row">
          <button className="lobby-back" type="button" onClick={() => setScreen("home")}>
            <AiOutlineArrowLeft /> Back
          </button>
        </div>

        <div className="settings-item">
          <p>Mute Music</p>
          <button
            className={classnames("lobby-btn", "custome-shadow")}
            type="button"
            onClick={() => {
              const nextValue = !isMusicMuted;
              setIsMusicMuted(nextValue);
              window.localStorage.setItem("ttt_music_muted", String(nextValue));
            }}
          >
            {isMusicMuted ? "Muted" : "On"}
          </button>
        </div>

        <div className="settings-item">
          <p>Enable Motion</p>
          <button
            className={classnames("lobby-btn", "custome-shadow")}
            type="button"
            onClick={() => {
              const nextValue = !enableAnimations;
              setEnableAnimations(nextValue);
              window.localStorage.setItem("ttt_enable_animations", String(nextValue));
            }}
          >
            {enableAnimations ? "Enabled" : "Disabled"}
          </button>
        </div>
      </div>
    </section>
  );

  const renderScreen = () => {
    if (screen === "home") {
      return renderHomeScreen();
    }

    if (screen === "lobby") {
      return renderLobbyScreen();
    }

    if (screen === "leaderboard") {
      return renderLeaderboard();
    }

    if (screen === "settings") {
      return renderSettings();
    }

    if (screen === "game" && activeRoomCode && player) {
      return (
        <TicTacToe
          roomCode={activeRoomCode}
          player={player}
          isMusicMuted={isMusicMuted}
          runWithLoader={runWithLoader}
          onToggleMusic={() => {
            const nextValue = !isMusicMuted;
            setIsMusicMuted(nextValue);
            window.localStorage.setItem("ttt_music_muted", String(nextValue));
          }}
          onProfileUpdate={(updatedPlayer) => {
            setPlayer(updatedPlayer);
          }}
          onLeave={() => {
            setActiveRoomCode(null);
            setScreen("lobby");
            refreshPublicRooms().catch(() => {
              // ignore
            });
            refreshLeaderboard().catch(() => {
              // ignore
            });
          }}
        />
      );
    }

    return renderHomeScreen();
  };

  const isInMatch = screen === "game" && Boolean(activeRoomCode && player);

  return (
    <main
      className={classnames(
        isInMatch ? "match-screen-root" : "title-screen-root",
        !enableAnimations && "motion-off"
      )}
      style={isInMatch ? { backgroundColor: matchBackgroundColor } : undefined}
    >
      {!isInMatch ? renderTopBar() : null}
      {renderScreen()}
      {activeRequests > 0 ? (
        <div className="app-loader-overlay">
          <div className="app-loader-card">
            <AiOutlineLoading3Quarters className="loader-spin" />
            <span>Syncing Match Data...</span>
          </div>
        </div>
      ) : null}
      <audio autoPlay={true} loop={true} muted={isMusicMuted} src="Loli.mp3" />
      {!isInMatch ? (
        <span className="fixed bottom-1 text-sm">Project By AJ4200 c 2023</span>
      ) : null}
    </main>
  );
}
