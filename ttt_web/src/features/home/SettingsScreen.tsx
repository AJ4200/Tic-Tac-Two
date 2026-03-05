import classnames from "classnames";
import { AiOutlineArrowLeft } from "react-icons/ai";
import type { CpuDifficulty } from "@/types/game";

type SettingsScreenProps = {
  isMusicMuted: boolean;
  musicVolume: number;
  enableAnimations: boolean;
  cpuDifficulty: CpuDifficulty;
  onBack: () => void;
  onToggleMusic: () => void;
  onMusicVolumeChange: (volume: number) => void;
  onToggleAnimations: () => void;
  onCpuDifficultyChange: (difficulty: CpuDifficulty) => void;
};

export function SettingsScreen({
  isMusicMuted,
  musicVolume,
  enableAnimations,
  cpuDifficulty,
  onBack,
  onToggleMusic,
  onMusicVolumeChange,
  onToggleAnimations,
  onCpuDifficultyChange,
}: SettingsScreenProps) {
  return (
    <section className="title-screen-content">
      <h1>
        <span>Set-</span>
        <span>tings</span>
      </h1>

      <div className="lobby-card mt-8">
        <div className="lobby-row">
          <button className="lobby-back" type="button" onClick={onBack}>
            <AiOutlineArrowLeft /> Back
          </button>
        </div>

        <div className="settings-item">
          <p>Mute Music</p>
          <button className={classnames("lobby-btn", "custome-shadow")} type="button" onClick={onToggleMusic}>
            {isMusicMuted ? "Muted" : "On"}
          </button>
        </div>

        <div className="settings-item settings-item-volume">
          <p>Volume</p>
          <div className="settings-volume">
            <input
              className="settings-slider"
              type="range"
              min={0}
              max={100}
              step={1}
              value={musicVolume}
              onChange={(event) => onMusicVolumeChange(Number(event.target.value))}
            />
            <span className="settings-volume-value">{musicVolume}%</span>
          </div>
        </div>

        <div className="settings-item">
          <p>Enable Motion</p>
          <button className={classnames("lobby-btn", "custome-shadow")} type="button" onClick={onToggleAnimations}>
            {enableAnimations ? "Enabled" : "Disabled"}
          </button>
        </div>

        <div className="settings-item">
          <p>CPU Difficulty</p>
          <select
            className="settings-select"
            value={cpuDifficulty}
            onChange={(event) => onCpuDifficultyChange(event.target.value as CpuDifficulty)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>
    </section>
  );
}
