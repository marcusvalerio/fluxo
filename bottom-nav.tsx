"use client"

import { Home, LayoutGrid, Target, Sparkles, MoreHorizontal } from "lucide-react"
import { motion } from "framer-motion"

export type Screen = "home" | "transactions" | "goals" | "calendar" | "bills" | "analytics"

interface BottomNavProps {
  currentScreen: Screen
  onNavigate: (screen: Screen) => void
  onOpenDrawer: () => void
}

export function BottomNav({ currentScreen, onNavigate, onOpenDrawer }: BottomNavProps) {
  const navItems = [
    { id: "home" as const, label: "Inicio", icon: Home },
    { id: "transactions" as const, label: "Historico", icon: LayoutGrid },
    { id: "goals" as const, label: "Metas", icon: Target },
  ]

  const isMainScreen = navItems.some(item => item.id === currentScreen)
  const moreActive = !isMainScreen

  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
    >
      {/* Glass background */}
      <div className="absolute inset-0 glass border-t border-border" />
      
      {/* Glow effect */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-10 bg-accent/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="relative flex items-center justify-around h-[76px] px-2">
        {navItems.map((item, index) => {
          const Icon = item.icon
          const isActive = currentScreen === item.id

          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2 relative group"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-bg"
                  className="absolute inset-x-2 inset-y-1 bg-accent/10 rounded-2xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              
              <motion.div
                animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <Icon className={`w-5 h-5 transition-all duration-300 ${
                  isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground"
                }`} />
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5"
                  >
                    <Sparkles className="w-2 h-2 text-accent" />
                  </motion.div>
                )}
              </motion.div>
              
              <span className={`text-[10px] font-medium tracking-wide transition-colors duration-300 ${
                isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground"
              }`}>
                {item.label}
              </span>
            </motion.button>
          )
        })}

        <motion.button
          onClick={onOpenDrawer}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 relative group"
        >
          {moreActive && (
            <motion.div
              layoutId="nav-bg"
              className="absolute inset-x-2 inset-y-1 bg-accent/10 rounded-2xl"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          
          <div className="relative">
            <MoreHorizontal className={`w-5 h-5 transition-all duration-300 ${
              moreActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground"
            }`} />
            {moreActive && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5"
              >
                <Sparkles className="w-2 h-2 text-accent" />
              </motion.div>
            )}
          </div>
          
          <span className={`text-[10px] font-medium tracking-wide transition-colors duration-300 ${
            moreActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground"
          }`}>
            Mais
          </span>
        </motion.button>
      </div>
    </motion.nav>
  )
}
