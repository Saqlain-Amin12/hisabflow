import { Home, Wallet, Users, User, Mail, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export const mainNav: NavItem[] = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/individual", label: "Personal", icon: Wallet },
  { href: "/team", label: "Team", icon: Users },
  { href: "/contact", label: "Contact", icon: Mail },
  { href: "/profile", label: "Profile", icon: User },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
