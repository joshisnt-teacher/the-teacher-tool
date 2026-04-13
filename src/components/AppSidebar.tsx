import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  Users, 
  BookOpen, 
  Settings, 
  Plus,
  GraduationCap,
  ChevronRight,
  User,
  Monitor,
  Ticket
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useClasses } from "@/hooks/useClasses";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuth } from "@/hooks/useAuth";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const mainNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Curriculum", url: "/curriculum-browser", icon: BookOpen },
  { title: "Classroom", url: "/classroom", icon: Monitor },
  { title: "Exit Tickets", url: "/activities", icon: Ticket },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const { data: classes } = useClasses();
  const { data: currentUser } = useCurrentUser();
  const { signOut } = useAuth();
  const [classesOpen, setClassesOpen] = useState(true);

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  const getNavClassName = (path: string) => {
    return isActive(path) 
      ? "bg-sidebar-accent text-sidebar-accent-foreground" 
      : "hover:bg-sidebar-accent/50";
  };

  const isClassRoute = currentPath.startsWith('/class/') || currentPath.startsWith('/create-class');
  const shouldExpandClasses = classesOpen || isClassRoute;

  return (
    <Sidebar className="border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground">
                {currentUser?.school?.name || "Assessment Platform"}
              </span>
              <span className="text-xs text-sidebar-foreground/60">
                {currentUser?.name}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className={getNavClassName(item.url)}>
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Classes Section */}
        <SidebarGroup>
          <Collapsible open={shouldExpandClasses} onOpenChange={setClassesOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent/50 rounded-md p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {!collapsed && <span>Classes</span>}
                </div>
                {!collapsed && (
                  <ChevronRight 
                    className={`h-4 w-4 transition-transform ${shouldExpandClasses ? 'rotate-90' : ''}`} 
                  />
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* Create New Class */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className={getNavClassName('/create-class')}>
                      <NavLink to="/create-class">
                        <Plus className="h-4 w-4" />
                        {!collapsed && <span>Create Class</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  {/* List of Classes */}
                  {classes?.map((classItem) => (
                    <SidebarMenuItem key={classItem.id}>
                      <SidebarMenuButton 
                        asChild 
                        className={getNavClassName(`/class/${classItem.id}`)}
                      >
                        <NavLink to={`/class/${classItem.id}`}>
                          <User className="h-4 w-4" />
                          {!collapsed && (
                            <div className="flex flex-col items-start">
                              <span className="text-sm font-medium truncate max-w-[160px]">
                                {classItem.class_name}
                              </span>
                              <span className="text-xs text-sidebar-foreground/60">
                                {classItem.subject} • {classItem.year_level}
                              </span>
                            </div>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={signOut}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <User className="h-4 w-4 mr-2" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
