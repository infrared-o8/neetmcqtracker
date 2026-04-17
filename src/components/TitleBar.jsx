import { Maximize2, Minus, X } from "lucide-react";

async function withWindow(action, onFallback) {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const appWindow = getCurrentWindow();
    await action(appWindow);
  } catch {
    if (onFallback) {
      onFallback();
    }
  }
}

export function TitleBar() {
  return (
    <header
      className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-white/10 bg-zinc-950/65 px-4 backdrop-blur-xl"
    >
      <div data-tauri-drag-region className="flex h-full flex-1 items-center">
        <p className="text-xs font-medium uppercase tracking-[0.26em] text-zinc-300">
          NEET MCQ Tracker Pro
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => withWindow((w) => w.minimize())}
          className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
          title="Minimize"
        >
          <Minus size={14} />
        </button>
        <button
          type="button"
          onClick={() =>
            withWindow(
              async (w) => {
                const isMaximized = await w.isMaximized();
                if (isMaximized) {
                  await w.unmaximize();
                } else {
                  await w.maximize();
                }
              },
              () => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                } else {
                  document.exitFullscreen().catch(() => {});
                }
              },
            )
          }
          className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
          title="Maximize"
        >
          <Maximize2 size={14} />
        </button>
        <button
          type="button"
          onClick={() => withWindow((w) => w.close(), () => window.close())}
          className="grid h-7 w-7 place-items-center rounded-lg border border-rose-400/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/25"
          title="Close"
        >
          <X size={14} />
        </button>
      </div>
    </header>
  );
}
