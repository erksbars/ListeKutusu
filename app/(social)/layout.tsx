import Link from "next/link";
import { PrimaryNavigation } from "@/app/components/PrimaryNavigation";

export default function SocialLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="social-shell">
      <header className="social-shell-navigation" data-testid="social-shell-navigation">
        <div className="social-shell-navigation-inner">
          <Link href="/" className="social-shell-brand">ListeKutusu</Link>
          <PrimaryNavigation />
        </div>
      </header>
      {children}
    </div>
  );
}
