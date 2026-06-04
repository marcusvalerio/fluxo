"use client"

import { AnalyticsScreen } from "@/components/analytics-screen"
import { BillModal } from "@/components/bill-modal"
import { BillsScreen } from "@/components/bills-screen"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/button"
import { CalendarScreen } from "@/components/calendar-screen"
import { DrawerMenu } from "@/components/drawer-menu"
import { FloatingActionButton } from "@/components/floating-action-button"
import { GoalModal } from "@/components/goal-modal"
import { GoalsScreen } from "@/components/goals-screen"
import { HomeScreen } from "@/components/home-screen"
import { LimitModal } from "@/components/limit-modal"
import { OnboardingScreen } from "@/components/onboarding-screen"
import { TransactionItem } from "@/components/transaction-item"
import { TransactionModal } from "@/components/transaction-modal"
import { TransactionsScreen } from "@/components/transactions-screen"
import { ConfirmDialog } from "@/components/confirm-dialog"

  
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
