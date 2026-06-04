"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Calendar, FileText, TrendingUp, Shield, Sparkles, ChevronRight } from "lucide-react"
import type { Screen } from "./bottom-nav"

interface DrawerMenuProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (screen: Screen) => void
  onOpenLimitModal: () => void
}

export function DrawerMenu({ isOpen, onClose, onNavigate, onOpenLimitModal }: DrawerMenuProps) {
  const menuItems = [
    {
      id: "calendar" as Screen,
      icon: Calendar,
      label: "Calendario",
      desc: "Visualize gastos por dia",
      color: "from-accent/20 to-accent/5",
      iconColor: "text-accent",
    },
    {
      id: "bills" as Screen,
      icon: FileText,
      label: "Contas Fixas",
      desc: "Gerencie despesas recorrentes",
      color: "from-warning/20 to-warning/5",
      iconColor: "text-warning",
    },
    {
      id: "analytics" as Screen,
      icon: TrendingUp,
      label: "Analise",
      desc: "Graficos e tendencias",
      color: "from-success/20 to-success/5",
      iconColor: "text-success",
    },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.5 }}
            transition={{ type: "spring", damping: 35, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 bg-card rounded-t-[2rem] border-t border-border z-[201] p-6 pb-8 safe-bottom"
          >
            {/* Handle */}
            <div className="w-10 h-1.5 bg-border rounded-full mx-auto mb-6" />

            {/* Title */}
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-semibold text-foreground">
                Mais recursos
              </h2>
            </div>

            {/* Menu Items */}
            <div className="space-y-3 mb-4">
              {menuItems.map((item, index) => {
                const Icon = item.icon
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onNavigate(item.id)
                      onClose()
                    }}
                    className={`w-full flex items-center gap-4 p-4 bg-gradient-to-r ${item.color} rounded-2xl border border-border/50 transition-all text-left group`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-card/80 flex items-center justify-center ${item.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </motion.button>
                )
              })}

              {/* Limit Option */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onOpenLimitModal()
                  onClose()
                }}
                className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-destructive/20 to-destructive/5 rounded-2xl border border-border/50 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-card/80 flex items-center justify-center text-destructive">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Limite Mensal</p>
                  <p className="text-xs text-muted-foreground">Defina seu teto de gastos</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </motion.button>
            </div>

            {/* Footer hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center text-xs text-muted-foreground"
            >
              Deslize para baixo para fechar
            </motion.p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
