import { BriefcaseBusiness, Home, Info, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useSession } from '@/auth/session-context';

const navItems = [
  { name: 'Home', url: '/', icon: Home },
  { name: 'Institutions', url: '/institutions', icon: Info },
]

function UserAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="var(--border)" strokeWidth="1" />
      <text
        x="8"
        y="8"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="8"
        fontFamily="'Inter', system-ui, sans-serif"
        fontWeight="500"
        fill="var(--text)"
      >
        {initial}
      </text>
    </svg>
  );
}

export function AppSidebar() {
  const { pathname } = useLocation();
  const { profile, signOut } = useSession();
  const displayName = profile?.name ?? profile?.email ?? 'Account';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-8 items-center gap-2 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <BriefcaseBusiness size={16} className="shrink-0" style={{ color: 'var(--text)' }} />
          <span
            className="truncate text-sm font-medium group-data-[collapsible=icon]:hidden"
            style={{ color: 'var(--text-h)' }}
          >
            We Impact
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.name}
                  isActive={pathname === item.url}
                  className="data-[active=true]:bg-background-selected data-[active=true]:text-background"
                >
                  <Link to={item.url}>
                    <item.icon />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={displayName}>
              {profile?.picture ? (
                <img src={profile.picture} alt="" className="size-4 rounded-full" />
              ) : (
                <UserAvatar name={displayName} />
              )}
              <span>{displayName}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sign out" onClick={() => signOut()}>
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
