import { AiOutlineLoading3Quarters } from "react-icons/ai";

type AppLoaderProps = {
  active: boolean;
};

export function AppLoader({ active }: AppLoaderProps) {
  if (!active) {
    return null;
  }

  return (
    <div className="app-loader-overlay">
      <div className="app-loader-card">
        <AiOutlineLoading3Quarters className="loader-spin" />
        <span>Syncing Match Data...</span>
      </div>
    </div>
  );
}
