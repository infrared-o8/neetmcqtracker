import { useState, useEffect, useCallback, useRef } from "react";
import { 
  pickVaultFolder, 
  getVaultHandle, 
  listMarkdownFiles, 
  readFile, 
  writeFile,
  readLocalBridge,
  writeLocalBridge
} from "../utils/localFileSystem";
import { useLogbookStore } from "../store/useLogbookStore";
import { useTrackerStore } from "../store/useTrackerStore";
import Editor from "@monaco-editor/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HardDrive, 
  Save, 
  Settings, 
  FileText, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  Info,
  ShieldAlert,
  Unlock,
  Terminal,
  Maximize2,
  Minimize2,
  Zap,
  Layers
} from "lucide-react";

export default function LogbookPage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [vaultHandle, setVaultHandle] = useState(null);
  const [manualPath, setManualPath] = useState("");
  const [isZenMode, setIsZenMode] = useState(false);

  const { fileId, fileName, setFile, sectionTags, permissionStatus, setPermissionStatus } = useLogbookStore();
  const serverUrl = useTrackerStore(s => s.preferences.serverUrl);
  const editorRef = useRef(null);

  const isNativeSupported = !!window.showDirectoryPicker;

  const verifyPermission = useCallback(async (handle) => {
    const options = { mode: 'readwrite' };
    try {
      if ((await handle.queryPermission(options)) === 'granted') {
        setPermissionStatus('granted');
        return true;
      }
    } catch (e) {
      console.error("Permission query failed", e);
    }
    setPermissionStatus('prompt');
    return false;
  }, [setPermissionStatus]);

  const requestPermission = async () => {
    if (!vaultHandle) return;
    const options = { mode: 'readwrite' };
    try {
      if ((await vaultHandle.requestPermission(options)) === 'granted') {
        setPermissionStatus('granted');
        loadFile();
      }
    } catch (e) {
      setError("Permission denied by browser.");
    }
  };

  const loadFile = useCallback(async () => {
    if (!fileId) return;
    setLoading(true);
    setError(null);
    try {
      if (fileId.includes("/") || fileId.includes("\\")) {
        const text = await readLocalBridge(serverUrl, fileId);
        setContent(text);
        setLoading(false);
        return;
      }

      const handle = await getVaultHandle();
      if (!handle) {
        setLoading(false);
        return;
      }
      setVaultHandle(handle);

      const hasPermission = await verifyPermission(handle);
      if (!hasPermission) {
        setLoading(false);
        return;
      }

      const files = await listMarkdownFiles(handle);
      const target = files.find(f => f.name === fileName);
      if (target) {
        const text = await readFile(target.handle);
        setContent(text);
      } else {
        setError(`File ${fileName} not found in vault.`);
      }
    } catch (e) {
      setError("Failed to read local file.");
    } finally {
      setLoading(false);
    }
  }, [fileId, fileName, serverUrl, verifyPermission]);

  useEffect(() => {
    loadFile();
  }, [loadFile]);

  const handlePickFolder = async () => {
    setError(null);
    try {
      const handle = await pickVaultFolder();
      if (handle) {
        setVaultHandle(handle);
        setPermissionStatus('granted');
        browseFiles(handle);
      }
    } catch (e) {
      console.error("[FS] Picker Error:", e);
      setError(e.message || "Folder selection failed.");
    }
  };

  const handleManualConnect = async (e) => {
    e.preventDefault();
    let path = manualPath.trim();
    if (!path) return;
    path = path.replace(/^["']|["']$/g, '');
    
    setLoading(true);
    try {
      const text = await readLocalBridge(serverUrl, path);
      const name = path.split(/[\\/]/).pop();
      setFile(path, name);
      setContent(text);
      setStatus("Connected via Bridge");
      setError(null);
    } catch (e) {
      setError(`Bridge Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveFile = async () => {
    if (!fileId) return;
    setSaving(true);
    try {
      if (fileId.includes("/") || fileId.includes("\\")) {
        await writeLocalBridge(serverUrl, fileId, content);
        setStatus("Saved via Bridge");
        setSaving(false);
        return;
      }

      if (!vaultHandle) return;
      const files = await listMarkdownFiles(vaultHandle);
      const target = files.find(f => f.name === fileName);
      if (target) {
        await writeFile(target.handle, content);
        setStatus("Saved Locally");
        setTimeout(() => setStatus(""), 3000);
      }
    } catch (e) {
      setError("Save Failed");
    } finally {
      setSaving(false);
    }
  };

  const browseFiles = async (handle = vaultHandle) => {
    if (!handle) return;
    setLoading(true);
    try {
      const files = await listMarkdownFiles(handle);
      setFileList(files);
    } catch (e) {
      setError("Failed to scan folder.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  return (
    <div className={`flex h-full flex-col overflow-hidden bg-transparent transition-all duration-500 ${isZenMode ? 'p-0' : ''}`}>
      {/* Logbook Header */}
      {!isZenMode && (
        <header className="flex shrink-0 items-center justify-between border-b border-white/5 bg-black/40 px-6 py-3 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-cyan-500/10 p-2 border border-cyan-500/20">
              <Layers className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase italic tracking-tighter text-white">Obsidian Core</h1>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                {fileId ? fileName : "No Active Note"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {permissionStatus === 'prompt' && vaultHandle && (
              <button 
                onClick={requestPermission}
                className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-1.5 text-[10px] font-black uppercase text-amber-400 border border-amber-500/20"
              >
                <Unlock className="h-3 w-3" /> Grant Access
              </button>
            )}
            {status && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" /> {status}
              </div>
            )}
            <button 
              onClick={saveFile}
              disabled={saving || (fileId && !fileId.includes("/") && !fileId.includes("\\") && permissionStatus !== 'granted') || !fileId}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-500 disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? "Syncing..." : "Push to Vault"}
            </button>
            <button 
              onClick={() => setIsZenMode(true)}
              className="p-2 rounded-xl bg-white/5 border border-white/5 text-zinc-500 hover:text-white transition"
              title="Zen Mode"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setShowConfig(!showConfig)}
              className={`p-2 rounded-xl border transition ${showConfig ? 'bg-zinc-800 border-white/20 text-white' : 'bg-white/5 border-white/5 text-zinc-500 hover:text-white'}`}
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </header>
      )}

      <div className="relative flex flex-1 overflow-hidden">
        <main className="relative flex-1 overflow-hidden bg-[#1e1e1e]">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-cyan-500" />
              <p className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-zinc-600">Initializing Monaco Engine...</p>
            </div>
          ) : !fileId ? (
            <div className="flex h-full flex-col lg:flex-row items-center justify-center p-8 gap-12 max-w-5xl mx-auto overflow-y-auto bg-zinc-950">
              <div className={`flex-1 flex flex-col items-center p-8 rounded-[2.5rem] border-2 border-dashed transition-all ${isNativeSupported ? 'border-white/10 bg-white/5 hover:border-cyan-500/30' : 'border-white/5 bg-black/20 opacity-40'}`}>
                <FolderOpen className="h-12 w-12 text-zinc-700 mb-6" />
                <h3 className="text-xl font-black text-white uppercase italic">Direct Access</h3>
                <p className="mt-2 text-[10px] text-zinc-500 uppercase tracking-widest leading-relaxed text-center">Chrome/Edge Only</p>
                <button disabled={!isNativeSupported} onClick={handlePickFolder} className="mt-8 rounded-2xl bg-white/10 px-8 py-4 text-xs font-black uppercase text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed">Select Folder</button>
              </div>
              <div className="flex-1 flex flex-col items-center p-8 rounded-[2.5rem] border-2 border-dashed border-white/10 bg-white/5 hover:border-violet-500/30 transition-all">
                <Terminal className="h-12 w-12 text-zinc-700 mb-6" />
                <h3 className="text-xl font-black text-white uppercase italic">Universal Bridge</h3>
                <p className="mt-2 text-[10px] text-zinc-500 uppercase tracking-widest leading-relaxed text-center">Works in Firefox</p>
                <form onSubmit={handleManualConnect} className="mt-8 w-full space-y-3">
                  <input value={manualPath} onChange={e => setManualPath(e.target.value)} placeholder="C:\Users\Name\OneDrive\..." className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white outline-none focus:border-violet-500/50" />
                  <button type="submit" className="w-full flex items-center justify-center gap-3 rounded-2xl bg-violet-600 px-8 py-4 text-xs font-black uppercase text-white transition hover:bg-violet-500">Connect Path</button>
                </form>
              </div>
            </div>
          ) : permissionStatus === 'prompt' && !fileId.includes("/") && !fileId.includes("\\") ? (
             <div className="flex h-full flex-col items-center justify-center p-12 text-center bg-zinc-950">
               <ShieldAlert className="h-16 w-16 text-amber-500 mb-6" />
               <h2 className="text-xl font-black text-white uppercase">Permission Required</h2>
               <button onClick={requestPermission} className="mt-8 rounded-2xl bg-amber-600 px-10 py-5 text-sm font-black uppercase text-white shadow-2xl hover:bg-amber-500 transition-all">Allow Access</button>
             </div>
          ) : (
            <div className="h-full w-full relative">
              {isZenMode && (
                <button 
                  onClick={() => setIsZenMode(false)}
                  className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/40 border border-white/10 text-zinc-500 hover:text-white transition opacity-20 hover:opacity-100"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
              )}
              <Editor
                height="100%"
                defaultLanguage="markdown"
                theme="vs-dark"
                value={content}
                onChange={setContent}
                onMount={handleEditorDidMount}
                options={{
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  minimap: { enabled: true },
                  wordWrap: "on",
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 24, bottom: 24 },
                  cursorSmoothCaretAnimation: "on",
                  smoothScrolling: true,
                  contextmenu: false,
                  renderLineHighlight: "all",
                  scrollbar: {
                    vertical: "visible",
                    horizontal: "hidden",
                    useShadows: false,
                    verticalHasArrows: false,
                    verticalScrollbarSize: 10
                  }
                }}
              />
            </div>
          )}
        </main>

        <AnimatePresence>
          {showConfig && !isZenMode && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }} animate={{ width: 340, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              className="flex shrink-0 flex-col border-l border-white/5 bg-zinc-900/40 backdrop-blur-xl overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <section>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-4">Performance</h2>
                  <div className="rounded-2xl border border-white/5 bg-black/40 p-4">
                     <p className="text-[10px] text-zinc-400 leading-relaxed uppercase">
                       Monaco Engine Active. Virtualization enabled for files up to 1M+ characters.
                     </p>
                  </div>
                </section>
                <section>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-4">Quick Insert Targets</h2>
                  <div className="space-y-3">
                    {sectionTags.map((t) => (
                      <div key={t.tag} className="rounded-2xl border border-white/5 bg-black/40 p-4">
                        <div className="flex items-center gap-2 mb-2">
                           <span className={`text-[10px] font-black uppercase tracking-tighter ${t.color}`}>#{t.tag}</span>
                        </div>
                        <p className="text-[10px] font-mono text-zinc-600 truncate">{t.header}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {fileList.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-lg rounded-[2.5rem] border border-white/10 bg-zinc-900 p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-white italic">Vault Contents</h2>
                  <button onClick={() => setFileList([])} className="text-zinc-500 hover:text-white transition">✕</button>
                </div>
                <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                   <div className="space-y-2">
                      {fileList.map((f) => (
                        <button key={f.path} onClick={() => { setFile(f.path, f.name); setFileList([]); loadFile(); }} className="w-full flex items-center gap-4 rounded-2xl bg-white/5 border border-white/5 p-4 text-left hover:bg-cyan-500/10 transition group">
                           <FileText className="h-5 w-5 text-zinc-600 group-hover:text-cyan-400" />
                           <div className="min-w-0">
                              <p className="text-sm font-bold text-white truncate">{f.name}</p>
                              <p className="text-[9px] text-zinc-600 truncate">{f.path}</p>
                           </div>
                        </button>
                      ))}
                   </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 rounded-2xl bg-red-500 px-6 py-3 shadow-2xl text-white font-black uppercase text-[10px]">
          <AlertCircle className="h-4 w-4" />
          {error}
          <button onClick={() => setError(null)} className="ml-4 opacity-70 hover:opacity-100">✕</button>
        </div>
      )}
    </div>
  );
}
