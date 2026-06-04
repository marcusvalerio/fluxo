"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { FinanceProvider, useFinance, type Transaction, type Goal } from "@/lib/finance-context"
import { OnboardingScreen } from "@/components/screens/onboarding-screen"
import { HomeScreen } from "@/components/screens/home-screen"
import { TransactionsScreen } from "@/components/screens/transactions-screen"
import { GoalsScreen } from "@/components/screens/goals-screen"
import { CalendarScreen } from "@/components/screens/calendar-screen"
import { BillsScreen } from "@/components/screens/bills-screen"
import { AnalyticsScreen } from "@/components/screens/analytics-screen"
import { BottomNav, type Screen } from "@/components/bottom-nav"
import { DrawerMenu } from "@/components/drawer-menu"
import { FloatingActionButton } from "@/components/floating-action-button"
import { TransactionModal } from "@/components/modals/transaction-modal"
import { LimitModal } from "@/components/modals/limit-modal"
import { GoalModal } from "@/components/modals/goal-modal"
import { BillModal } from "@/components/modals/bill-modal"
import { ConfirmDialog } from "@/components/modals/confirm-dialog"

function AppContent() {
  const { state, deleteTransaction } = useFinance()
  const [currentScreen, setCurrentScreen] = useState<Screen>("home")
  const [drawerOpen, setDrawerOpen] = useState(false)
  
  // Modal states
  const [txModalOpen, setTxModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [prefilledDate, setPrefilledDate] = useState<string | null>(null)
  const [limitModalOpen, setLimitModalOpen] = useState(false)
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [billModalOpen, setBillModalOpen] = useState(false)
  
  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  if (!state.onboarded) {
    return <OnboardingScreen />
  }

  const handleOpenNewTransaction = (date?: string) => {
    setEditingTx(null)
    setPrefilledDate(date || null)
    setTxModalOpen(true)
  }

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTx(tx)
    setPrefilledDate(null)
    setTxModalOpen(true)
  }

  const handleDeleteTransaction = (id: number) => {
    setPendingDeleteId(id)
    setConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (pendingDeleteId !== null) {
      deleteTransaction(pendingDeleteId)
      setPendingDeleteId(null)
    }
    setConfirmOpen(false)
  }

  const handleOpenGoalModal = (goal?: Goal) => {
    setEditingGoal(goal || null)
    setGoalModalOpen(true)
  }

  const showFab = currentScreen !== "analytics"

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Screen Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="min-h-screen"
        >
          {currentScreen === "home" && (
            <HomeScreen
              onOpenNewTransaction={handleOpenNewTransaction}
              onOpenLimitModal={() => setLimitModalOpen(true)}
            />
          )}
          {currentScreen === "transactions" && (
            <TransactionsScreen
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
              onOpenNewTransaction={handleOpenNewTransaction}
            />
          )}
          {currentScreen === "goals" && (
            <GoalsScreen
              onOpenNewGoal={() => handleOpenGoalModal()}
              onUpdateGoal={handleOpenGoalModal}
            />
          )}
          {currentScreen === "calendar" && (
            <CalendarScreen onOpenNewTransaction={handleOpenNewTransaction} />
          )}
          {currentScreen === "bills" && (
            <BillsScreen onOpenNewBill={() => setBillModalOpen(true)} />
          )}
          {currentScreen === "analytics" && <AnalyticsScreen />}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomNav
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        onOpenDrawer={() => setDrawerOpen(true)}
      />

      {/* Drawer Menu */}
      <DrawerMenu
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={setCurrentScreen}
        onOpenLimitModal={() => setLimitModalOpen(true)}
      />

      {/* FAB */}
      <FloatingActionButton
        onClick={() => handleOpenNewTransaction()}
        visible={showFab}
      />

      {/* Modals */}
      <TransactionModal
        isOpen={txModalOpen}
        onClose={() => {
          setTxModalOpen(false)
          setEditingTx(null)
          setPrefilledDate(null)
        }}
        editingTransaction={editingTx}
        prefilledDate={prefilledDate}
      />

      <LimitModal
        isOpen={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
      />

      <GoalModal
        isOpen={goalModalOpen}
        onClose={() => {
          setGoalModalOpen(false)
          setEditingGoal(null)
        }}
        editingGoal={editingGoal}
      />

      <BillModal
        isOpen={billModalOpen}
        onClose={() => setBillModalOpen(false)}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Excluir lançamento?"
        message="Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirmOpen(false)
          setPendingDeleteId(null)
        }}
      />
    </div>
  )
}

export default function FluxoApp() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  )
}
