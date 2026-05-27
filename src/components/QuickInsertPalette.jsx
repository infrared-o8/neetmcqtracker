import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "../utils/api";
import { useTrackerStore } from "../store/useTrackerStore";
import { useLogbookStore } from "../store/useLogbookStore";
import { 
  Zap, 
  X, 
  Type, 
  Command, 
  CheckCircle2,
  Loader2,
  AlertCircle,
  Terminal,
  Camera,
  Image as ImageIcon,
  ChevronRight
} from "lucide-react";

export function QuickInsertPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState(null);

  const serverUrl = useTrackerStore(s => s.preferences.serverUrl);
  const sectionTags = useLogbookStore(s => s.sectionTags);
  const inputRef = useRef(null);

  // --- KEYBOARD TRIGGER (Ctrl+Space) ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.code === "Space") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setInputValue("");
      setError(null);
    }
  }, [isOpen]);

  /** 
   * Robust Input Parser
   * Pulls ACTUAL state directly from store to prevent stale data.
   */
  const getParsedPayload = (raw) => {
    const trimmed = raw.trim();
    const state = useLogbookStore.getState();
    const defaultHeader = state.mainHeader || "# Final NEET Prep:";

    if (!trimmed) return { text: "", header: defaultHeader };

    const words = trimmed.split(/\s+/);
    const firstWord = words[0].toLowerCase();
    
    // Find matching tag
    const tagMatch = state.sectionTags.find(t => `#${t.tag.toLowerCase()}` === firstWord);
    
    if (tagMatch) {
      // Map the tag ID (e.g. bioHeader) to its current value in the store
      const actualHeader = state[tagMatch.id] || defaultHeader;
      const content = words.slice(1).join(" ");
      
      console.log(`[Palette Bridge] Tag Detected: ${firstWord} -> Mapping to Header: '${actualHeader}'`);
      return { 
        text: content, 
        header: actualHeader 
      };
    }

    console.log(`[Palette Bridge] No tag match. Using default Header: '${defaultHeader}'`);
    return { text: trimmed, header: defaultHeader };
  };

  const triggerBridge = async (mode, text, header) => {
    setLoading(true);
    setError(null);
    try {
      const target = (!serverUrl || serverUrl.includes("onrender.com")) 
        ? "http://localhost:3847" 
        : serverUrl;

      console.log(`[Palette Bridge] Dispatching POST: header='${header}'`);

      const res = await apiFetch(target, "/api/local-vault/trigger-script", {
        method: "POST",
        body: JSON.stringify({ mode, text, header })
      });
      
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Bridge script failed to launch.");
      }
      
      setStatus(mode === "capture" || mode === "paste" ? "Launching QuestCap..." : "Sent to Obsidian!");
      setTimeout(() => {
        setIsOpen(false);
        setStatus("");
      }, 1500);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const { text, header } = getParsedPayload(inputValue);
        triggerBridge("paste", text, header);
        return;
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { text, header } = getParsedPayload(inputValue);
    if (!text && !inputValue.trim()) return;
    triggerBridge("append", text, header);
  };

  // Autocomplete Suggestions
  const suggestions = useMemo(() => {
    if (!inputValue.startsWith("#") || inputValue.includes(" ")) return [];
    const query = inputValue.slice(1).toLowerCase();
    return sectionTags.filter(t => t.tag.toLowerCase().startsWith(query));
  }, [inputValue, sectionTags]);

  const applyAutocomplete = (tag) => {
    setInputValue(`#${tag} `);
    inputRef.current?.focus();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 sm:p-8">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ scale: 0.9, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 40, opacity: 0 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-950 shadow-2xl"
          >
            <form onSubmit={handleSubmit} onPaste={handlePaste}>
              <div className="flex items-center gap-4 border-b border-white/5 bg-white/5 p-6">
                <div className="rounded-full bg-violet-500/20 p-2 text-violet-400">
                    <Terminal className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Local Python Bridge</p>
                    <h2 className="text-sm font-bold text-white uppercase italic">QuestCap Pro Logic</h2>
                </div>
                <button type="button" onClick={() => setIsOpen(false)} className="text-zinc-600 hover:text-white transition">
                    <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-8">
                <div className="mb-8 flex gap-4">
                    <button 
                      type="button"
                      onClick={() => {
                        const { text, header } = getParsedPayload(inputValue);
                        triggerBridge("capture", text, header);
                      }}
                      className="flex-1 flex flex-col items-center justify-center p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all group"
                    >
                        <Camera className="h-8 w-8 text-zinc-500 group-hover:text-cyan-400 mb-4" />
                        <span className="text-xs font-black uppercase tracking-widest text-white text-center">Trigger Screenshot</span>
                        <span className="mt-2 text-[9px] text-zinc-600 uppercase font-bold text-center">Logs above detected tag header</span>
                    </button>
                    
                    <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-3xl bg-white/5 border border-white/5 border-dashed">
                        <ImageIcon className={`h-8 w-8 text-emerald-400/50 mb-4 animate-pulse`} />
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-500 text-center">
                          Direct Paste Support
                        </span>
                        <span className="mt-2 text-[9px] text-zinc-700 uppercase font-bold text-center">Ctrl+V any image to log</span>
                    </div>
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                      <Type className="h-3 w-3" /> Targeted Append
                    </div>
                    <div className="flex gap-2">
                       {sectionTags.map(t => (
                         <span key={t.tag} className={`text-[8px] font-bold uppercase ${t.color}`}>#{t.tag}</span>
                       ))}
                    </div>
                  </div>

                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Tab" && suggestions.length > 0) {
                        e.preventDefault();
                        applyAutocomplete(suggestions[0].tag);
                      }
                    }}
                    placeholder="Type #bioimportant, #chemimportant..."
                    className="w-full min-h-[100px] bg-transparent text-xl font-medium text-white outline-none placeholder:text-zinc-900 resize-none"
                  />

                  <AnimatePresence>
                    {suggestions.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-full left-0 mb-2 flex gap-2"
                      >
                        {suggestions.map(s => (
                          <button
                            key={s.tag}
                            type="button"
                            onClick={() => applyAutocomplete(s.tag)}
                            className={`flex items-center gap-2 rounded-lg bg-zinc-900 border border-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${s.color} hover:bg-zinc-800 transition-colors`}
                          >
                            <ChevronRight className="h-3 w-3" /> {s.tag}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-10 flex items-center justify-between border-t border-white/5 pt-8">
                  <div className="flex gap-4">
                    <span className="flex items-center gap-2 text-[10px] font-bold text-zinc-700 uppercase tracking-widest">
                      <Command className="h-3 w-3" /> + Space to close
                    </span>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading || !inputValue.trim()}
                    className="group flex items-center gap-3 rounded-2xl bg-violet-600 px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-violet-500/20 transition-all hover:bg-violet-500 disabled:opacity-30 disabled:grayscale"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      status ? <CheckCircle2 className="h-4 w-4" /> : <Zap className="h-4 w-4 fill-current" />
                    )}
                    {status || "Execute Append"}
                  </button>
                </div>

                {error && (
                  <div className="mt-6 flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
                  </div>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
