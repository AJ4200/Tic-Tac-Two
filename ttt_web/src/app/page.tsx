"use client";

import React, { useEffect, useState } from "react";
import classnames from "classnames";
import { motion } from "framer-motion";
import { IconContext } from "react-icons";
import { AiFillGithub, AiFillLinkedin } from "react-icons/ai";
import TicTacToe from "./TicTacToe";
import { AppLoader } from "@/features/home/AppLoader";
import { LeaderboardScreen } from "@/features/home/LeaderboardScreen";
import { LobbyScreen } from "@/features/home/LobbyScreen";
import { MainMenu } from "@/features/home/MainMenu";
import { SettingsScreen } from "@/features/home/SettingsScreen";
import { useApiClient } from "@/hooks/useApiClient";
import { STORAGE_KEYS } from "@/lib/constants";
import { getRandomBrightColor } from "@/lib/random";
import type {
  CpuDifficulty,
  GameMode,
  LeaderboardPlayer,
  PlayerProfile,
  PublicRoom,
  RoomPayload,
  Screen,
} from "@/types/game";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [gameMode, setGameMode] = useState<GameMode>("online");
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
  const [musicVolume, setMusicVolume] = useState(70);
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [cpuDifficulty, setCpuDifficulty] = useState<CpuDifficulty>("medium");
  const [matchBackgroundColor, setMatchBackgroundColor] = useState("#ffffff");
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const { activeRequests, runWithLoader, callApi } = useApiClient();

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
    const savedPlayerId = window.localStorage.getItem(STORAGE_KEYS.playerId);
    const payload = await callApi<PlayerProfile>("/api/players/register", {
      method: "POST",
      body: JSON.stringify({
        playerId: savedPlayerId,
        name: playerName || "Player",
      }),
    });

    setPlayer(payload);
    setPlayerName(payload.name);
    window.localStorage.setItem(STORAGE_KEYS.playerId, payload.playerId);
    window.localStorage.setItem(STORAGE_KEYS.playerName, payload.name);
    return payload;
  };

  const beginMatch = (mode: GameMode, roomCode: string | null) => {
    setGameMode(mode);
    setActiveRoomCode(roomCode);
    setMatchBackgroundColor(getRandomBrightColor());
    setScreen("game");
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

      beginMatch("online", payload.room.code);
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

      beginMatch("online", payload.room.code);
      setMessage("");
      await Promise.all([refreshPublicRooms(), refreshLeaderboard()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not join room");
    } finally {
      setIsLoading(false);
    }
  };

  const startCpuMatch = async () => {
    try {
      setIsLoading(true);
      await ensurePlayer();
      beginMatch("cpu", null);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start CPU match");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedName = window.localStorage.getItem(STORAGE_KEYS.playerName);
    const savedMuted = window.localStorage.getItem(STORAGE_KEYS.musicMuted);
    const savedVolume = window.localStorage.getItem(STORAGE_KEYS.musicVolume);
    const savedAnimations = window.localStorage.getItem(STORAGE_KEYS.enableAnimations);
    const savedDifficulty = window.localStorage.getItem(STORAGE_KEYS.cpuDifficulty);

    if (savedName) {
      setPlayerName(savedName);
    }
    if (savedMuted) {
      setIsMusicMuted(savedMuted === "true");
    }
    if (savedVolume) {
      const parsedVolume = Number(savedVolume);
      if (Number.isFinite(parsedVolume)) {
        setMusicVolume(Math.min(100, Math.max(0, parsedVolume)));
      }
    }
    if (savedAnimations) {
      setEnableAnimations(savedAnimations === "true");
    }
    if (savedDifficulty === "easy" || savedDifficulty === "medium" || savedDifficulty === "hard") {
      setCpuDifficulty(savedDifficulty);
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

  useEffect(() => {
    if (!audioElement) {
      return;
    }
    audioElement.muted = isMusicMuted;
    audioElement.volume = musicVolume / 100;
  }, [audioElement, isMusicMuted, musicVolume]);

  const isInMatch = screen === "game" && Boolean(player);

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

  const renderScreen = () => {
    if (screen === "home") {
      return (
        <MainMenu
          enableAnimations={enableAnimations}
          onPlay={() => setScreen("lobby")}
          onLeaderboard={() => {
            refreshLeaderboard().catch(() => {
              setMessage("Could not load leaderboard");
            });
            setScreen("leaderboard");
          }}
          onSettings={() => setScreen("settings")}
        />
      );
    }

    if (screen === "lobby") {
      return (
        <LobbyScreen
          playerName={playerName}
          roomName={roomName}
          joinCode={joinCode}
          publicRooms={publicRooms}
          message={message}
          isLoading={isLoading}
          onBack={() => setScreen("home")}
          onPlayerNameChange={setPlayerName}
          onRoomNameChange={setRoomName}
          onJoinCodeChange={setJoinCode}
          onSaveName={() => {
            ensurePlayer()
              .then((registeredPlayer) => {
                setPlayer(registeredPlayer);
                setMessage("Profile saved");
              })
              .catch((error) => {
                setMessage(error instanceof Error ? error.message : "Could not save profile");
              });
          }}
          onCreatePublic={() => void createRoom(true)}
          onCreatePrivate={() => void createRoom(false)}
          onJoinByCode={() => void joinRoom(joinCode)}
          onRefreshRooms={() => {
            refreshPublicRooms().catch(() => {
              setMessage("Could not refresh public rooms");
            });
          }}
          onJoinRoom={(code) => void joinRoom(code)}
          onPlayCpu={() => void startCpuMatch()}
        />
      );
    }

    if (screen === "leaderboard") {
      return (
        <LeaderboardScreen
          leaderboard={leaderboard}
          onBack={() => setScreen("home")}
          onRefresh={() => {
            refreshLeaderboard().catch(() => {
              setMessage("Could not refresh leaderboard");
            });
          }}
        />
      );
    }

    if (screen === "settings") {
      return (
        <SettingsScreen
          isMusicMuted={isMusicMuted}
          musicVolume={musicVolume}
          enableAnimations={enableAnimations}
          cpuDifficulty={cpuDifficulty}
          onBack={() => setScreen("home")}
          onToggleMusic={() => {
            const nextValue = !isMusicMuted;
            setIsMusicMuted(nextValue);
            window.localStorage.setItem(STORAGE_KEYS.musicMuted, String(nextValue));
          }}
          onMusicVolumeChange={(volume) => {
            setMusicVolume(volume);
            window.localStorage.setItem(STORAGE_KEYS.musicVolume, String(volume));
          }}
          onToggleAnimations={() => {
            const nextValue = !enableAnimations;
            setEnableAnimations(nextValue);
            window.localStorage.setItem(STORAGE_KEYS.enableAnimations, String(nextValue));
          }}
          onCpuDifficultyChange={(difficulty) => {
            setCpuDifficulty(difficulty);
            window.localStorage.setItem(STORAGE_KEYS.cpuDifficulty, difficulty);
          }}
        />
      );
    }

    if (screen === "game" && player) {
      return (
        <TicTacToe
          mode={gameMode}
          roomCode={activeRoomCode}
          player={player}
          isMusicMuted={isMusicMuted}
          cpuDifficulty={cpuDifficulty}
          runWithLoader={runWithLoader}
          onToggleMusic={() => {
            const nextValue = !isMusicMuted;
            setIsMusicMuted(nextValue);
            window.localStorage.setItem(STORAGE_KEYS.musicMuted, String(nextValue));
          }}
          onProfileUpdate={(updatedPlayer) => {
            setPlayer(updatedPlayer);
          }}
          onLeave={() => {
            setActiveRoomCode(null);
            setGameMode("online");
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

    return null;
  };

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
      <AppLoader active={activeRequests > 0} />
      <audio
        autoPlay={true}
        loop={true}
        muted={isMusicMuted}
        ref={setAudioElement}
        src="Loli.mp3"
      />
      {!isInMatch ? (
        <span className="fixed bottom-1 text-sm">Project By AJ4200 c 2023</span>
      ) : null}
    </main>
  );
}
