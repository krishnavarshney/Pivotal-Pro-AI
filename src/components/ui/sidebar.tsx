
import { createContext, useContext, useState, useEffect, forwardRef, HTMLAttributes, ReactNode, FC, ButtonHTMLAttributes } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "./utils"
import { useMediaQuery } from "../../hooks/useMediaQuery"
import { PanelRightClose, PanelRightOpen } from 'lucide-react';

// --- Context ---
type SidebarContextProps = {
  isCollapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  isMobile: boolean
  isMobileOpen: boolean
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const SidebarContext = createContext<SidebarContextProps | null>(null)

// --- Provider ---
export function SidebarProvider({ children }: { children: ReactNode }) {
  const isMobile = useMediaQuery("(max-width: 1023px)")
  
  const [isCollapsed, setCollapsedState] = useState(() => {
    if (typeof document === "undefined") return false
    try {
      const cookie = document.cookie.split('; ').find(row => row.startsWith(`sidebar_collapsed_state=`))
      return cookie ? cookie.split('=')[1] === 'true' : false
    } catch (e) {
      return false
    }
  })
  
  const [isMobileOpen, setMobileOpen] = useState(false)

  const setCollapsed = (collapsed: boolean) => {
      setCollapsedState(collapsed);
      if (typeof document !== "undefined") {
        document.cookie = `sidebar_collapsed_state=${collapsed}; path=/; max-age=31536000`
      }
  }

  useEffect(() => {
    if (!isMobile) {
      setMobileOpen(false)
    }
  }, [isMobile])

  return (
    <SidebarContext.Provider
      value={{ isCollapsed, setCollapsed, isMobile, isMobileOpen, setMobileOpen }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

// --- Hook ---
export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

// --- Components ---

const SidebarCollapseButton = () => {
    const { isCollapsed, setCollapsed } = useSidebar();
    return (
        <div className="absolute top-4 -right-4 z-20">
             <button onClick={() => setCollapsed(!isCollapsed)} aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'} className="w-8 h-8 rounded-full bg-background border border-border shadow-md flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground">
                {isCollapsed ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />}
            </button>
        </div>
    )
}

export const Sidebar = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => {
        const { isCollapsed, isMobile, isMobileOpen, setMobileOpen } = useSidebar();
        const MotionDiv = motion.div as any;
        const SIDEBAR_WIDTH = "18rem";
        const SIDEBAR_COLLAPSED_WIDTH = "5rem";

        if (isMobile) {
            return (
                <AnimatePresence>
                    {isMobileOpen && (
                        <>
                            <MotionDiv
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => setMobileOpen(false)}
                                className="fixed inset-0 z-40 bg-black/50"
                            />
                            <MotionDiv
                                ref={ref}
                                initial={{ x: "-100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-100%" }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className={cn("fixed top-0 left-0 z-50 h-full flex flex-col glass-panel", className)}
                                style={{ width: SIDEBAR_WIDTH }}
                                {...props}
                            >
                                {children}
                            </MotionDiv>
                        </>
                    )}
                </AnimatePresence>
            )
        }

        return (
            <MotionDiv
                ref={ref}
                animate={{ width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className={cn("relative h-full glass-panel rounded-xl flex flex-col flex-shrink-0 z-30", className)}
                {...props}
            >
                {children}
                <SidebarCollapseButton />
            </MotionDiv>
        )
    }
);
Sidebar.displayName = "Sidebar";

export const SidebarHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => <div ref={ref} className={cn("flex h-[65px] items-center flex-shrink-0", className)} {...props} />
);
SidebarHeader.displayName = "SidebarHeader";

export const SidebarContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => <div ref={ref} className={cn("flex-1 overflow-y-auto overflow-x-hidden", className)} {...props} />
);
SidebarContent.displayName = "SidebarContent";

export const SidebarFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => <div ref={ref} className={cn("p-2 border-t border-border/50 flex-shrink-0", className)} {...props} />
);
SidebarFooter.displayName = "SidebarFooter";

export const SidebarTrigger = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ className, ...props }, ref) => {
        const { isMobile, setMobileOpen } = useSidebar();
        if (!isMobile) return null;
        return (
            <button
                ref={ref}
                onClick={() => setMobileOpen(true)}
                className={cn("p-2 rounded-md hover:bg-accent", className)}
                {...props}
            >
                <PanelRightOpen size={24} />
                <span className="sr-only">Open sidebar</span>
            </button>
        )
    }
);
SidebarTrigger.displayName = "SidebarTrigger";