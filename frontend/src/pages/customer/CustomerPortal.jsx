import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api, formatCurrency, formatDate } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from '../../components/ui/table'
import { DollarSign, FileText, Download, CreditCard, Eye, Plus, LogOut, FilePlus, Sparkles } from 'lucide-react'

const STATUS_COLORS = {
  draft: 'secondary', submitted: 'info', in_review: 'warning',
  query_raised: 'destructive', approved: 'success', rejected: 'destructive',
  disbursed: 'success', completed: 'success',
}

export default function CustomerPortal() {
  const { user, logout } = useAuth()

  const { data: loansData } = useQuery({
    queryKey: ['customer-portal-loans', user?.id],
    queryFn: async () => (await api.get(`/loans?customer_id=${user.id}`)).data,
    enabled: !!user?.id,
  })

  const { data: dues } = useQuery({
    queryKey: ['customer-portal-dues', user?.id],
    queryFn: async () => (await api.get(`/emi/customer/${user.id}/dues`)).data,
    enabled: !!user?.id,
  })

  const { data: apps } = useQuery({
    queryKey: ['customer-portal-apps', user?.id],
    queryFn: async () => (await api.get(`/applications?customer_id=${user.id}`)).data,
    enabled: !!user?.id,
  })

  const activeLoans = loansData?.loans?.filter(l => ['active', 'disbursed'].includes(l.status)) || []
  const totalOutstanding = activeLoans.reduce((s, l) => s + parseFloat(l.outstanding_principal || 0), 0)
  const pendingDues = dues?.filter(d => !d.is_paid) || []
  const totalDue = pendingDues.reduce((s, d) => s + parseFloat(d.emi_amount || 0), 0)
  const paidDues = dues?.filter(d => d.is_paid) || []
  const totalPaidEmi = paidDues.reduce((s, d) => s + parseFloat(d.emi_amount || 0), 0)

  const handleDownloadReceipt = (emiId) => {
    const url = `/api/emi/${emiId}/receipt`
    window.open(url, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Customer Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>CMF Customer Portal</span>
          </h1>
          <p className="text-xs text-slate-500">
            Welcome back, <span className="font-semibold text-slate-700">{user?.profile?.first_name || user?.email}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user?.customerCode && (
            <span className="text-xs px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg font-mono font-medium text-slate-600">
              Code: {user.customerCode}
            </span>
          )}
          <Link to="/applications/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm flex items-center gap-1.5 px-4 py-2">
              <Plus className="w-4 h-4" />
              Apply for New Loan
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            Logout
          </Button>
        </div>
      </header>

      <main className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Banner CTA for New Users / No Active Loans */}
        {!activeLoans.length && !apps?.applications?.length && (
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-6 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4 border border-blue-700/50">
            <div className="space-y-1 max-w-xl">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-blue-500/30 text-blue-200 rounded-full border border-blue-400/30">
                <Sparkles className="w-3.5 h-3.5 text-blue-300" /> Fast & Easy Application Process
              </div>
              <h2 className="text-lg font-bold text-white">Apply for a New Microfinance Loan</h2>
              <p className="text-xs text-blue-100 leading-relaxed">
                Submit your loan application online in just a few simple steps. Complete applicant, KYC, and income details directly from your portal.
              </p>
            </div>
            <Link to="/applications/new">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs shadow-lg px-6 py-2.5 gap-2">
                <FilePlus className="w-4 h-4 text-blue-700" />
                Start New Application
              </Button>
            </Link>
          </div>
        )}

        {/* Quick Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border border-slate-200/80 shadow-2xs">
            <CardContent className="p-5">
              <div className="text-xs font-medium text-slate-500">Active Loans</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{activeLoans.length}</div>
            </CardContent>
          </Card>
          <Card className="border border-slate-200/80 shadow-2xs">
            <CardContent className="p-5">
              <div className="text-xs font-medium text-slate-500">Outstanding Balance</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalOutstanding)}</div>
            </CardContent>
          </Card>
          <Card className="border border-slate-200/80 shadow-2xs">
            <CardContent className="p-5">
              <div className="text-xs font-medium text-slate-500">Pending Dues</div>
              <div className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalDue)}</div>
            </CardContent>
          </Card>
          <Card className="border border-slate-200/80 shadow-2xs">
            <CardContent className="p-5">
              <div className="text-xs font-medium text-slate-500">Total Repaid</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalPaidEmi)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Applications Section */}
        <Card className="border border-slate-200/80 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" /> My Applications
            </CardTitle>
            <Link to="/applications/new">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs gap-1.5 shadow-2xs">
                <Plus className="w-3.5 h-3.5" /> Apply New Loan
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-xs">App #</TableHead>
                  <TableHead className="text-xs">Product</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Submitted Date</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps?.applications?.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-semibold text-xs text-slate-900">{a.application_number}</TableCell>
                    <TableCell className="text-xs text-slate-700">{a.product_name || '—'}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-900">{formatCurrency(a.loan_amount)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLORS[a.status] || 'secondary'} className="text-[11px] capitalize">
                        {a.status?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{formatDate(a.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link to={`/applications/${a.id}`}>
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 text-xs gap-1">
                            <Eye className="w-3.5 h-3.5" /> View
                          </Button>
                        </Link>
                        {a.status === 'query_raised' && (
                          <Link to={`/applications/${a.id}/edit`}>
                            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-2.5 py-1 shadow-xs">
                              Fix Query & Resubmit
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!apps?.applications?.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center text-slate-500 gap-2">
                        <FileText className="w-10 h-10 text-slate-300" />
                        <div>
                          <p className="font-semibold text-slate-700 text-sm">No Active Applications Found</p>
                          <p className="text-xs text-slate-400">You haven't submitted any loan applications yet.</p>
                        </div>
                        <Link to="/applications/new" className="mt-2">
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-2xs gap-1.5">
                            <Plus className="w-4 h-4" /> Apply for New Loan
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* My Loans Section */}
        <Card className="border border-slate-200/80 shadow-2xs">
          <CardHeader className="py-4">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" /> My Active Loans
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-xs">Loan #</TableHead>
                  <TableHead className="text-xs">Product</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs">EMI</TableHead>
                  <TableHead className="text-xs">Outstanding</TableHead>
                  <TableHead className="text-xs">Repaid</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeLoans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-semibold text-xs text-slate-900">{loan.loan_number}</TableCell>
                    <TableCell className="text-xs text-slate-700">{loan.product_name}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-900">{formatCurrency(loan.loan_amount)}</TableCell>
                    <TableCell className="text-xs text-slate-700">{formatCurrency(loan.emi_amount)}</TableCell>
                    <TableCell className="text-xs font-medium text-amber-700">{formatCurrency(loan.outstanding_principal)}</TableCell>
                    <TableCell className="text-xs font-medium text-emerald-700">{formatCurrency(loan.total_repaid)}</TableCell>
                    <TableCell><Badge variant="success" className="text-[11px] uppercase">{loan.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {!activeLoans.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                      No active loan accounts currently linked to your customer profile.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* EMI Schedule */}
        <Card className="border border-slate-200/80 shadow-2xs">
          <CardHeader className="py-4">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-600" /> EMI Schedule & Due Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-xs">Loan #</TableHead>
                  <TableHead className="text-xs">EMI #</TableHead>
                  <TableHead className="text-xs">Due Date</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs">Days Overdue</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dues?.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-semibold text-xs text-slate-900">{d.loan_number}</TableCell>
                    <TableCell className="text-xs text-slate-600">#{d.emi_number}</TableCell>
                    <TableCell className="text-xs text-slate-700">{formatDate(d.due_date)}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-900">{formatCurrency(d.emi_amount)}</TableCell>
                    <TableCell className="text-xs text-slate-600">{d.days_overdue || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={d.is_overdue ? 'destructive' : d.is_paid ? 'success' : 'warning'} className="text-[11px]">
                        {d.is_paid ? 'Paid' : d.is_overdue ? 'Overdue' : 'Due'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {d.is_paid && (
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadReceipt(d.id)} className="text-blue-600 text-xs">
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!dues?.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                      No EMI schedule records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card className="border border-slate-200/80 shadow-2xs">
          <CardHeader className="py-4">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-600" /> Payment History & Receipts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-xs">Payment Date</TableHead>
                  <TableHead className="text-xs">Loan #</TableHead>
                  <TableHead className="text-xs">EMI #</TableHead>
                  <TableHead className="text-xs">Amount Paid</TableHead>
                  <TableHead className="text-xs">Payment Method</TableHead>
                  <TableHead className="text-xs">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paidDues.length > 0 ? (
                  paidDues.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="text-xs text-slate-700">{d.payment_date ? formatDate(d.payment_date) : formatDate(d.due_date)}</TableCell>
                      <TableCell className="font-semibold text-xs text-slate-900">{d.loan_number}</TableCell>
                      <TableCell className="text-xs text-slate-600">#{d.emi_number}</TableCell>
                      <TableCell className="text-xs font-bold text-emerald-700">{formatCurrency(d.emi_amount)}</TableCell>
                      <TableCell className="text-xs capitalize text-slate-700">{d.payment_method || 'Cash / Online'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadReceipt(d.id)} className="text-blue-600 text-xs gap-1">
                          <Download className="w-3.5 h-3.5" /> Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                      No payment history recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

