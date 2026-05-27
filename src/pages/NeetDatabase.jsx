import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  BookOpen, 
  Download, 
  ExternalLink, 
  ChevronRight, 
  ChevronLeft,
  Filter,
  X,
  Maximize2,
  Minimize2,
  Loader2,
  Info,
  Book,
  Compass,
  ShieldCheck,
  Zap,
  Sparkles
} from "lucide-react";
import { DATABASE_CATEGORIES, NCERT_BOOKS, getFlattenedChapters } from "../data/neetDatabase";
import { GlowCard } from "../components/ui/GlowCard";

export default function NeetDatabase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activePdf, setActivePdf] = useState(null);
  const [isViewerMaximized, setIsViewerMaximized] = useState(false);
  const [useGoogleViewer, setUseGoogleViewer] = useState(false);

  // Load all chapters once
  const ALL_CHAPTERS = useMemo(() => getFlattenedChapters(), []);

  const filteredPdfs = useMemo(() => {
    let result = ALL_CHAPTERS;
    
    if (selectedCategory !== "all") {
      result = result.filter(pdf => pdf.subject === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const queryTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
      result = result.filter(pdf => {
        const searchableText = `${pdf.title} ${pdf.bookTitle} ${pdf.class}th ${pdf.tags.join(" ")}`.toLowerCase();
        return queryTerms.every(term => searchableText.includes(term));
      });
    }
    
    return result;
  }, [searchQuery, selectedCategory, ALL_CHAPTERS]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pb-32">
      <header className="mb-10 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">NEET Vault</h1>
            <p className="mt-1 text-[11px] text-zinc-500 font-black uppercase tracking-[0.2em]">Official NCERT Reference Archive</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 px-4 py-2">
            <Book className="h-4 w-4 text-fuchsia-400" />
            <span className="text-[10px] font-black text-fuchsia-100 uppercase tracking-widest">{ALL_CHAPTERS.length} Chapters Indexed</span>
          </div>
        </div>
        
        {/* Dynamic Full-Width Search Bar */}
        <div className="relative group w-full">
          <div className="absolute inset-0 bg-cyan-500/5 blur-3xl group-focus-within:bg-cyan-500/15 transition-all duration-500" />
          <div className="relative flex items-center bg-black/60 border border-white/10 rounded-[2rem] px-6 py-5 group-focus-within:border-cyan-500/40 group-focus-within:ring-4 group-focus-within:ring-cyan-500/10 transition-all duration-300 shadow-2xl">
            <Search className="h-6 w-6 text-zinc-500 mr-4 group-focus-within:text-cyan-400 transition-colors" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by chapter name, class (11th/12th), or subject..."
              className="bg-transparent border-none outline-none text-lg font-medium text-white w-full placeholder:text-zinc-700"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="ml-4 p-2 rounded-full hover:bg-white/10 text-zinc-500 hover:text-white transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar: Sub-sections */}
        <div className="lg:col-span-3 space-y-6">
          <section className="genz-glass rounded-3xl border-white/5 p-6 bg-black/20">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
              <Compass className="h-3 w-3" /> Library Sections
            </h2>
            <div className="space-y-2">
              <button 
                onClick={() => { setSelectedCategory("all"); setActivePdf(null); }}
                className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                  selectedCategory === "all" ? "bg-white/10 text-white border border-white/10" : "text-zinc-500 hover:bg-white/5"
                }`}
              >
                <span>Full Archive</span>
                <span className="text-[10px] opacity-40">{ALL_CHAPTERS.length}</span>
              </button>
              {DATABASE_CATEGORIES.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setActivePdf(null); }}
                  className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                    selectedCategory === cat.id ? "bg-white/10 text-white border border-white/10" : "text-zinc-500 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={cat.color}>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </div>
                  <span className="text-[10px] opacity-40">
                    {ALL_CHAPTERS.filter(p => p.subject === cat.id).length}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <div className="p-6 rounded-3xl border border-white/5 bg-cyan-500/5">
             <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2">Search diversity</p>
             <p className="text-[10px] text-zinc-500 leading-relaxed italic">
               Try searching by class ("12th"), chapter name ("Genetics"), or subject ("Physics").
             </p>
          </div>
        </div>

        {/* Main: Dynamic List & Viewer */}
        <div className="lg:col-span-9">
          {activePdf ? (
            <motion.section 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/60 shadow-2xl transition-all duration-500 ${isViewerMaximized ? 'fixed inset-0 z-[999] rounded-none' : ''}`}
            >
               <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 bg-zinc-900/80 p-5 backdrop-blur-md">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setActivePdf(null)} className="p-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white transition">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="min-w-0">
                      <h2 className="max-w-[150px] truncate text-base font-black italic text-white md:max-w-md">{activePdf.title}</h2>
                      <div className="flex items-center gap-2">
                        <p className="text-[8px] font-bold uppercase tracking-widest text-cyan-400">{activePdf.bookTitle}</p>
                        <span className="h-1 w-1 rounded-full bg-zinc-700" />
                        <span className="flex items-center gap-1 text-[8px] font-black uppercase text-zinc-500">
                          {useGoogleViewer ? <Sparkles className="h-2 w-2" /> : <ShieldCheck className="h-2 w-2" />}
                          {useGoogleViewer ? 'Cloud Rendering' : 'Native Viewer'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Firefox Fix Toggle */}
                    <button 
                      onClick={() => setUseGoogleViewer(!useGoogleViewer)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[8px] font-black uppercase transition-all ${
                        useGoogleViewer ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400' : 'border-white/5 bg-white/5 text-zinc-500 hover:text-white'
                      }`}
                      title="Switch rendering engine for Firefox compatibility"
                    >
                      {useGoogleViewer ? 'Disable Cloud Fix' : 'Firefox Fix'}
                    </button>

                    <button 
                      onClick={() => setIsViewerMaximized(!isViewerMaximized)}
                      className="p-2.5 rounded-xl bg-white/5 text-zinc-400 hover:text-white transition"
                    >
                      {isViewerMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </button>

                    <a 
                      href={activePdf.directUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-white transition-all hover:bg-white/20"
                      title="Open in new window (Most reliable)"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      External
                    </a>

                    <a href={activePdf.directUrl} download className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition">
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
               </div>

               <div className={`w-full bg-zinc-950 ${isViewerMaximized ? 'h-[calc(100vh-80px)]' : 'h-[700px]'}`}>
                  {useGoogleViewer ? (
                    <iframe 
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(activePdf.directUrl)}&embedded=true`}
                      className="w-full h-full border-0"
                      title={activePdf.title}
                    />
                  ) : (
                    <iframe 
                      src={`${activePdf.directUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                      className="w-full h-full border-0"
                      title={activePdf.title}
                    />
                  )}
               </div>
            </motion.section>
          ) : (
            <div className="space-y-8">
              {/* Dynamic Search Results (List style) */}
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-600 flex items-center gap-2">
                  <Book className="h-3 w-3" />
                  {searchQuery ? `Refined Results: ${searchQuery}` : "Catalogue Overview"}
                </h2>
                <p className="text-[10px] font-bold text-zinc-700">{filteredPdfs.length} Chapters indexed</p>
              </div>

              <div className="grid gap-4">
                {filteredPdfs.map((pdf) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={pdf.id}
                    className="group flex flex-col md:flex-row items-center gap-6 p-4 rounded-3xl border border-white/5 bg-zinc-900/40 hover:border-cyan-500/30 hover:bg-zinc-900/60 transition-all duration-300"
                  >
                    <div className="flex-1 min-w-0 pr-4 pl-2">
                       <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border border-white/5 bg-white/5 ${DATABASE_CATEGORIES.find(c => c.id === pdf.subject)?.color}`}>
                            {pdf.subject}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border border-white/5 bg-zinc-800 text-zinc-500">
                            Class {pdf.class}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border border-white/5 bg-black/40 text-cyan-400">
                            Chapter {pdf.chNum}
                          </span>
                       </div>
                       <h3 className="text-lg font-black text-white italic leading-tight group-hover:text-cyan-100 transition-colors">{pdf.title}</h3>
                       <p className="mt-1 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{pdf.bookTitle}</p>
                       
                       <div className="mt-5 flex items-center gap-3">
                          <button 
                            onClick={() => setActivePdf(pdf)}
                            className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-300 transition-all hover:bg-cyan-600 hover:text-white"
                          >
                            <BookOpen className="h-3 w-3" /> Quick View
                          </button>
                          <a 
                            href={pdf.directUrl} 
                            download
                            className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-500 transition-all hover:border-emerald-500/50 hover:text-emerald-400"
                          >
                            <Download className="h-3 w-3" /> Download
                          </a>
                          <a 
                            href={pdf.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-zinc-900/60 text-zinc-600 hover:text-fuchsia-400 transition"
                            title="Official NCERT Page"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                       </div>
                    </div>
                  </motion.div>
                ))}

                {filteredPdfs.length === 0 && (
                  <div className="py-24 text-center rounded-[3rem] border-2 border-dashed border-white/5 bg-black/20 backdrop-blur-sm">
                    <div className="h-16 w-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                      <Search className="h-8 w-8 text-zinc-800" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-widest">Vault Entry Not Found</h3>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-600 mt-2">The requested chapter code is not in the 2026 index</p>
                    <button 
                      onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
                      className="mt-8 rounded-full border border-cyan-500/30 px-6 py-2 text-[10px] font-black uppercase text-cyan-500 transition-all hover:bg-cyan-500 hover:text-white"
                    >
                      Reset Filter Matrix
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
