import { NavLink } from "react-router-dom";
import { LayoutDashboard, Trophy, User, Video, Settings } from "lucide-react";
import { SignedIn, UserButton } from "../../hooks/useAuthShim";

export function MobileNav() {
  const navClass = ({ isActive }) =>
    `flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
      isActive ? "text-cyan-400" : "text-zinc-500"
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-zinc-950/80 backdrop-blur-xl border-t border-white/5 md:hidden px-6">
      <div className="flex h-full items-center justify-between max-w-lg mx-auto">
        <NavLink to="/" end className={navClass}>
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Dashboard</span>
        </NavLink>

        <NavLink to="/leaderboard" className={navClass}>
          <Trophy className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Ranks</span>
        </NavLink>

        <NavLink to="/study-room" className={navClass}>
          <Video className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Live</span>
        </NavLink>

        <NavLink to="/profile" className={navClass}>
          <User className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Profile</span>
        </NavLink>

        <div className="flex items-center justify-center">
          <SignedIn>
            <UserButton appearance={{ elements: { userButtonAvatarBox: "h-7 w-7 border border-white/10 shadow-lg" } }} />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}
