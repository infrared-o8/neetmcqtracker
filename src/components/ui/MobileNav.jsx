import { NavLink } from "react-router-dom";
import { LayoutDashboard, Trophy, User, Video, BookOpen, FileText } from "lucide-react";
import { SignedIn, UserButton } from "../../hooks/useAuthShim";

export function MobileNav() {
  const navClass = ({ isActive }) =>
    `flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
      isActive ? "text-cyan-400" : "text-zinc-500"
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-zinc-950/80 backdrop-blur-xl border-t border-white/5 md:hidden px-2">
      <div className="flex h-full items-center justify-between max-w-lg mx-auto">
        <NavLink to="/" end className={navClass}>
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-tighter text-center">Dash</span>
        </NavLink>

        <NavLink to="/study-room" className={navClass}>
          <Video className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-tighter text-center">Live</span>
        </NavLink>

        <NavLink to="/database" className={navClass}>
          <BookOpen className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-tighter text-center">Vault</span>
        </NavLink>

        <NavLink to="/logbook" className={navClass}>
          <FileText className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-tighter text-center">Log</span>
        </NavLink>

        <NavLink to="/profile" className={navClass}>
          <User className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-tighter text-center">Profile</span>
        </NavLink>

        <div className="flex items-center justify-center">
          <SignedIn>
            <UserButton appearance={{ elements: { userButtonAvatarBox: "h-6 w-6 border border-white/10 shadow-lg" } }} />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}
