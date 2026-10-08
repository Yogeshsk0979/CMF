import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { AuthProvider } from './hooks/useAuth'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ApplicationList from './pages/applications/ApplicationList'
import ApplicationForm from './pages/applications/ApplicationForm'
import ApplicationDetail from './pages/applications/ApplicationDetail'
import LoanList from './pages/loans/LoanList'
import LoanDetail from './pages/loans/LoanDetail'
import EmiSchedule from './pages/loans/EmiSchedule'
import EmiCollection from './pages/emi/EmiCollection'
import Overdues from './pages/emi/Overdues'
import CustomerDues from './pages/emi/CustomerDues'
import DisbursementList from './pages/disbursements/DisbursementList'
import DisbursementForm from './pages/disbursements/DisbursementForm'
import LedgerPage from './pages/ledger/LedgerPage'
import LedgerDetail from './pages/ledger/LedgerDetail'
import JournalEntry from './pages/ledger/JournalEntry'
import LedgerAccounts from './pages/ledger/LedgerAccounts'
import TrialBalance from './pages/ledger/TrialBalance'
import TaskList from './pages/tasks/TaskList'
import AreaList from './pages/areas/AreaList'
import ProductList from './pages/products/ProductList'
import ReportsPage from './pages/reports/ReportsPage'
import CustomerList from './pages/customers/CustomerList'
import SettingsPage from './pages/settings/SettingsPage'
import UsersList from './pages/settings/UsersList'
import SettingsProductsList from './pages/settings/ProductsList'
import NotificationPage from './pages/notifications/NotificationPage'
import VerificationList from './pages/verification/VerificationList'
import FieldVisit from './pages/verification/FieldVisit'
import SmsPanel from './pages/communication/SmsPanel'
import EmailPanel from './pages/communication/EmailPanel'
import CustomerPortal from './pages/customer/CustomerPortal'
import PayEmi from './pages/customer/PayEmi'

function RoleGuard({ children, allowedRoles }) {
  const { user, hasRole } = useAuth()
  if (!user) return null
  if (!hasRole(...allowedRoles)) return <div className="p-8 text-center text-gray-500">Access Denied</div>
  return children
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  if (user.role === 'customer') {
    return (
      <Routes>
        <Route path="/customer/portal" element={<CustomerPortal />} />
        <Route path="/customer/pay-emi" element={<PayEmi />} />
        <Route path="/applications/new" element={<ApplicationForm />} />
        <Route path="/applications/:id" element={<ApplicationDetail />} />
        <Route path="/applications/:id/edit" element={<ApplicationForm />} />
        <Route path="*" element={<Navigate to="/customer/portal" replace />} />
      </Routes>
    )
  }

  const staffLayout = (Component, allowedRoles) => {
    const Wrapped = () => {
      const { hasRole } = useAuth()
      if (!hasRole(...allowedRoles)) return <div className="p-8 text-center text-gray-500">Access Denied</div>
      return <Component />
    }
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <Wrapped />
          </main>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={staffLayout(Dashboard, ['super_admin', 'branch_admin', 'team_leader', 'field_officer', 'collection_agent', 'lender', 'support'])} />
      <Route path="/applications" element={staffLayout(ApplicationList, ['super_admin', 'branch_admin', 'team_leader', 'field_officer'])} />
      <Route path="/applications/new" element={staffLayout(ApplicationForm, ['field_officer', 'team_leader', 'branch_admin', 'super_admin'])} />
      <Route path="/applications/:id/edit" element={staffLayout(ApplicationForm, ['field_officer', 'team_leader', 'branch_admin', 'super_admin'])} />
      <Route path="/applications/:id" element={staffLayout(ApplicationDetail, ['super_admin', 'branch_admin', 'team_leader', 'field_officer', 'collection_agent'])} />
      <Route path="/loans" element={staffLayout(LoanList, ['super_admin', 'branch_admin', 'team_leader', 'field_officer', 'collection_agent'])} />
      <Route path="/loans/:id" element={staffLayout(LoanDetail, ['super_admin', 'branch_admin', 'team_leader', 'field_officer', 'collection_agent'])} />
      <Route path="/loans/:id/schedule" element={staffLayout(EmiSchedule, ['super_admin', 'branch_admin', 'team_leader', 'field_officer', 'collection_agent'])} />
      <Route path="/emi" element={staffLayout(EmiCollection, ['collection_agent', 'team_leader', 'branch_admin', 'super_admin', 'field_officer'])} />
      <Route path="/emi/overdues" element={staffLayout(Overdues, ['collection_agent', 'team_leader', 'branch_admin', 'super_admin'])} />
      <Route path="/emi/dues" element={staffLayout(CustomerDues, ['field_officer', 'collection_agent', 'team_leader'])} />
      <Route path="/disbursements" element={staffLayout(DisbursementList, ['super_admin', 'branch_admin', 'team_leader'])} />
      <Route path="/disbursements/new/:loanId" element={staffLayout(DisbursementForm, ['super_admin', 'branch_admin'])} />
      <Route path="/ledger" element={staffLayout(LedgerPage, ['super_admin', 'branch_admin', 'team_leader'])} />
      <Route path="/ledger/:accountId" element={staffLayout(LedgerDetail, ['super_admin', 'branch_admin', 'team_leader'])} />
      <Route path="/ledger/accounts" element={staffLayout(LedgerAccounts, ['super_admin', 'branch_admin', 'team_leader'])} />
      <Route path="/ledger/journal" element={staffLayout(JournalEntry, ['super_admin', 'branch_admin', 'team_leader'])} />
      <Route path="/ledger/trial-balance" element={staffLayout(TrialBalance, ['super_admin', 'branch_admin', 'team_leader'])} />
      <Route path="/tasks" element={staffLayout(TaskList, ['field_officer', 'collection_agent', 'team_leader', 'branch_admin', 'super_admin'])} />
      <Route path="/areas" element={staffLayout(AreaList, ['team_leader', 'branch_admin', 'super_admin'])} />
      <Route path="/areas/:id" element={staffLayout(AreaList, ['team_leader', 'branch_admin', 'super_admin'])} />
      <Route path="/products" element={staffLayout(ProductList, ['super_admin', 'branch_admin'])} />
      <Route path="/reports" element={staffLayout(ReportsPage, ['branch_admin', 'super_admin', 'team_leader'])} />
      <Route path="/customers" element={staffLayout(CustomerList, ['branch_admin', 'super_admin', 'team_leader'])} />
      <Route path="/settings" element={staffLayout(SettingsPage, ['super_admin', 'branch_admin'])} />
      <Route path="/settings/users" element={staffLayout(UsersList, ['super_admin', 'branch_admin'])} />
      <Route path="/settings/products" element={staffLayout(SettingsProductsList, ['super_admin', 'branch_admin'])} />
      <Route path="/notifications" element={staffLayout(NotificationPage, ['super_admin', 'branch_admin', 'team_leader', 'field_officer', 'collection_agent', 'lender', 'support'])} />
      <Route path="/verification" element={staffLayout(VerificationList, ['field_officer', 'collection_agent', 'team_leader', 'branch_admin', 'super_admin'])} />
      <Route path="/verification/field-visit" element={staffLayout(FieldVisit, ['field_officer', 'collection_agent'])} />
      <Route path="/communication/sms" element={staffLayout(SmsPanel, ['super_admin', 'branch_admin', 'team_leader', 'field_officer'])} />
      <Route path="/communication/email" element={staffLayout(EmailPanel, ['super_admin', 'branch_admin', 'team_leader', 'field_officer'])} />
      <Route path="/customer/portal" element={<CustomerPortal />} />
      <Route path="/customer/pay-emi" element={<PayEmi />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
