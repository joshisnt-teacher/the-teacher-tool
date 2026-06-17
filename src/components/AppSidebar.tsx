import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  Settings,
  Plus,
  ChevronRight,
  User,
  Monitor,
  Ticket,
  Library,
  BookOpen,
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
import { useAuth } from "@/hooks/useAuth";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EdufiedLogo } from "@/components/EdufiedLogo";

const mainNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Classroom", url: "/classroom", icon: Monitor },
  { title: "Exit Tickets", url: "/exit-tickets", icon: Ticket },
  { title: "Lessons", url: "/lessons", icon: BookOpen },
  { title: "Resources", url: "/resources", icon: Library },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const { data: classes } = useClasses();
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
      ? "bg-white/10 text-sidebar-foreground border-l-[3px] border-primary"
      : "hover:bg-white/5 text-sidebar-foreground/70";
  };

  const isClassRoute = currentPath.startsWith('/class/') || currentPath.startsWith('/create-class') || currentPath.startsWith('/classroom/');
  const shouldExpandClasses = classesOpen || isClassRoute;

  const getRelatedClassId = () => {
    if (currentPath.startsWith('/classroom/')) {
      return currentPath.split('/')[2];
    }
    return null;
  };

  const relatedClassId = getRelatedClassId();

  return (
    <Sidebar className="border-sidebar-border/50 bg-sidebar">
      <SidebarHeader className="h-16 border-b border-sidebar-border/50 flex items-center px-4">
        <EdufiedLogo collapsed={collapsed} className="text-sidebar-foreground" toolName="Pulse" />
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
              <SidebarGroupLabel className="cursor-pointer hover:bg-primary/5 hover:text-primary/80 rounded-md p-2 flex items-center justify-between text-sidebar-foreground/60">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {!collapsed && <span>Classes</span>}
                </div>
                {!collapsed && (
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${shouldExpandClasses ? 'rotate-90 text-primary' : ''}`}
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
                        <Plus className="h-5 w-5" />
                        {!collapsed && <span className="text-sm font-medium">Create Class</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* List of Classes */}
                  {classes
                    ?.filter((classItem) => !classItem.is_demo)
                    .map((classItem) => {
                      const active = isActive(`/class/${classItem.id}`);
                      const related = relatedClassId === classItem.id;
                      const className = active
                        ? "bg-white/10 text-sidebar-foreground font-medium relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[3px] before:bg-primary before:rounded-r-md"
                        : related
                          ? "hover:bg-white/5 text-sidebar-foreground/70 relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-3 before:w-[3px] before:bg-primary/40 before:rounded-r-md"
                          : "hover:bg-white/5 text-sidebar-foreground/70";

                      return (
                        <SidebarMenuItem key={classItem.id}>
                          <SidebarMenuButton
                            asChild
                            className={`${className} !h-auto min-h-[3rem] py-1.5`}
                          >
                            <NavLink to={`/class/${classItem.id}`}>
                              <User className="h-5 w-5" />
                              {!collapsed && (
                                <div className="flex flex-col items-start">
                                  <span className="text-sm font-medium truncate max-w-[160px]">
                                    {classItem.class_name}
                                  </span>
                                  <span className={`text-xs ${active || related ? 'text-primary/70' : 'text-sidebar-foreground/40'}`}>
                                    {classItem.subject} • {classItem.year_level}
                                  </span>
                                </div>
                              )}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start text-sidebar-foreground/60 hover:bg-primary/10 hover:text-primary"
        >
          <User className="h-4 w-4 mr-2" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
