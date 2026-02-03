import { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

interface UpdateInfo {
  available: boolean;
  version?: string;
  body?: string;
}

function UpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({ available: false });
  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      const update = await check();
      if (update) {
        setUpdateInfo({
          available: true,
          version: update.version,
          body: update.body,
        });
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);
    }
  };

  const installUpdate = async () => {
    try {
      setUpdating(true);
      const update = await check();
      if (update) {
        await update.downloadAndInstall((event) => {
          switch (event.event) {
            case "Started":
              setProgress(0);
              break;
            case "Progress":
              if (event.data.contentLength) {
                setProgress(Math.round((event.data.chunkLength / event.data.contentLength) * 100));
              }
              break;
            case "Finished":
              setProgress(100);
              break;
          }
        });
        await relaunch();
      }
    } catch (error) {
      console.error("Failed to install update:", error);
      setUpdating(false);
    }
  };

  if (!updateInfo.available) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm z-50">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary-100 rounded-full">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">Update Available</h4>
          <p className="text-sm text-gray-600 mt-1">
            Version {updateInfo.version} is available
          </p>
          {updating ? (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Downloading... {progress}%</p>
            </div>
          ) : (
            <button
              onClick={installUpdate}
              className="mt-3 btn-primary text-sm py-1 px-3"
            >
              Update Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default UpdateChecker;
