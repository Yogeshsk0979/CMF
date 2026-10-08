import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, formatCurrency, formatDate } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from '../../components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Download, TrendingUp, Users, AlertTriangle, DollarSign, Calendar } from 'lucide-react'

const PERIOD_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

export default function ReportsPage() {
  const [period, setPeriod] = useState('monthly')

  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ['reports-portfolio'],
    queryFn: async () => (await api.get('/reports/portfolio')).data,
  })

  const { data: collection, isLoading: collectionLoading } = useQuery({
    queryKey: ['reports-collection', period],
    queryFn: async () => (await api.get(`/reports/collection?period=${period}`)).data,
  })

  const { data: npa, isLoading: npaLoading } = useQuery({
    queryKey: ['reports-npa'],
    queryFn: async () => (await api.get('/reports/npa')).data,
  })

  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ['reports-agents'],
    queryFn: async () => (await api.get('/reports/agent-performance')).data,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500">Analytics and performance reports</p>
        </div>
      </div>

      <Tabs defaultValue="portfolio">
        <TabsList>
          <TabsTrigger value="portfolio">Portfolio Summary</TabsTrigger>
          <TabsTrigger value="collection">Collection Report</TabsTrigger>
          <TabsTrigger value="npa">NPA Report</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-blue-600" /><span className="text-sm text-gray-500">Total Disbursed</span></div>
                <div className="text-2xl font-bold mt-1">{formatCurrency(portfolio?.total_disbursed)}</div>
                <div className="text-xs text-gray-400 mt-1">{portfolio?.total_loans || 0} loans</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-600" /><span className="text-sm text-gray-500">Outstanding</span></div>
                <div className="text-2xl font-bold mt-1">{formatCurrency(portfolio?.total_outstanding)}</div>
                <div className="text-xs text-gray-400 mt-1">{portfolio?.active_loans || 0} active</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-600" /><span className="text-sm text-gray-500">Collected</span></div>
                <div className="text-2xl font-bold mt-1">{formatCurrency(portfolio?.total_collected)}</div>
                <div className="text-xs text-gray-400 mt-1">{portfolio?.collection_rate || 0}% rate</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-600" /><span className="text-sm text-gray-500">NPA Amount</span></div>
                <div className="text-2xl font-bold mt-1">{formatCurrency(portfolio?.npa_amount)}</div>
                <div className="text-xs text-gray-400 mt-1">{portfolio?.npa_count || 0} accounts</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Portfolio by Product</CardTitle>
                  <CardDescription>Disbursement and outstanding by product</CardDescription>
                </div>
                <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Export</Button>
              </div>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Loans</TableHead>
                  <TableHead>Disbursed</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Collected</TableHead>
                  <TableHead>NPA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolioLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">Loading...</TableCell></TableRow>
                ) : portfolio?.products?.length ? (
                  portfolio.products.map((p) => (
                    <TableRow key={p.product_id}>
                      <TableCell className="font-medium">{p.product_name}</TableCell>
                      <TableCell>{p.loan_count || 0}</TableCell>
                      <TableCell>{formatCurrency(p.disbursed_amount)}</TableCell>
                      <TableCell>{formatCurrency(p.outstanding)}</TableCell>
                      <TableCell>{formatCurrency(p.collected_amount)}</TableCell>
                      <TableCell><Badge variant={p.npa_count > 0 ? 'destructive' : 'success'}>{formatCurrency(p.npa_amount || 0)}</Badge></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No data available</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Portfolio by Branch</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead>Loans</TableHead>
                  <TableHead>Disbursed</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Collection Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolio?.branches?.length ? (
                  portfolio.branches.map((b) => (
                    <TableRow key={b.branch_id}>
                      <TableCell className="font-medium">{b.branch_name}</TableCell>
                      <TableCell>{b.loan_count || 0}</TableCell>
                      <TableCell>{formatCurrency(b.disbursed_amount)}</TableCell>
                      <TableCell>{formatCurrency(b.outstanding)}</TableCell>
                      <TableCell><Badge variant={b.collection_rate >= 80 ? 'success' : b.collection_rate >= 50 ? 'warning' : 'destructive'}>{b.collection_rate || 0}%</Badge></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-400">No data available</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="collection" className="space-y-6 mt-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="h-10 px-3 border rounded-md text-sm bg-white">
              {PERIOD_OPTIONS.map((p) => (<option key={p.value} value={p.value}>{p.label}</option>))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">Total Collected</div>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(collection?.total_collected)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">EMIs Collected</div>
                <div className="text-2xl font-bold">{collection?.emi_count || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">Pending</div>
                <div className="text-2xl font-bold text-amber-600">{collection?.pending_count || 0}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Collection Breakdown</CardTitle></CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>EMIs Due</TableHead>
                  <TableHead>Collected</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Overdue</TableHead>
                  <TableHead>Collection %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collectionLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">Loading...</TableCell></TableRow>
                ) : collection?.breakdown?.length ? (
                  collection.breakdown.map((b) => (
                    <TableRow key={b.period}>
                      <TableCell className="font-medium">{b.period}</TableCell>
                      <TableCell>{b.emi_due || 0}</TableCell>
                      <TableCell className="text-green-600 font-medium">{formatCurrency(b.collected_amount)}</TableCell>
                      <TableCell>{b.pending || 0}</TableCell>
                      <TableCell><Badge variant={b.overdue > 0 ? 'destructive' : 'success'}>{b.overdue || 0}</Badge></TableCell>
                      <TableCell><Badge variant={b.collection_rate >= 90 ? 'success' : b.collection_rate >= 60 ? 'warning' : 'destructive'}>{b.collection_rate || 0}%</Badge></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No data for selected period</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="npa" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Substandard (1-90d)', amount: npa?.substandard_amount, count: npa?.substandard_count, color: 'text-amber-600' },
              { label: 'Doubtful (91-180d)', amount: npa?.doubtful_amount, count: npa?.doubtful_count, color: 'text-orange-600' },
              { label: 'Loss (181-360d)', amount: npa?.loss_amount, count: npa?.loss_count, color: 'text-red-600' },
              { label: 'Total NPA', amount: npa?.total_npa_amount, count: npa?.total_npa_count, color: 'text-red-700' },
            ].map((bucket, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500">{bucket.label}</div>
                  <div className={`text-2xl font-bold mt-1 ${bucket.color}`}>{formatCurrency(bucket.amount || 0)}</div>
                  <div className="text-xs text-gray-400">{bucket.count || 0} accounts</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>NPA Accounts</CardTitle>
                <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Export</Button>
              </div>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Loan #</TableHead>
                  <TableHead>EMI #</TableHead>
                  <TableHead>Days Overdue</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {npaLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">Loading...</TableCell></TableRow>
                ) : npa?.accounts?.length ? (
                  npa.accounts.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.first_name} {a.last_name}</TableCell>
                      <TableCell>{a.loan_number}</TableCell>
                      <TableCell>#{a.emi_number}</TableCell>
                      <TableCell><Badge variant="destructive">{a.days_overdue} days</Badge></TableCell>
                      <TableCell className="font-medium">{formatCurrency(a.emi_amount)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          a.days_overdue <= 90 ? 'warning' : a.days_overdue <= 180 ? 'destructive' : 'destructive'
                        }>
                          {a.days_overdue <= 90 ? 'Substandard' : a.days_overdue <= 180 ? 'Doubtful' : 'Loss'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No NPA accounts</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-600" /><span className="text-sm text-gray-500">Total Agents</span></div>
                <div className="text-2xl font-bold">{agents?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-600" /><span className="text-sm text-gray-500">Total Collected</span></div>
                <div className="text-2xl font-bold">{formatCurrency(agents?.reduce((s, a) => s + parseFloat(a.total_collected || 0), 0))}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-amber-600" /><span className="text-sm text-gray-500">Avg. per Agent</span></div>
                <div className="text-2xl font-bold">{formatCurrency(agents?.length ? agents.reduce((s, a) => s + parseFloat(a.total_collected || 0), 0) / agents.length : 0)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Field Officers Performance</CardTitle>
                <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Export</Button>
              </div>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Total Applications</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Total Disbursed</TableHead>
                  <TableHead>Collected</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentsLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-400">Loading...</TableCell></TableRow>
                ) : agents?.length ? (
                  agents.map((a) => {
                    const pct = a.target > 0 ? Math.round((a.total_collected / a.target) * 100) : 0
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.first_name} {a.last_name}</TableCell>
                        <TableCell className="capitalize">{a.role?.replace('_', ' ')}</TableCell>
                        <TableCell>{a.total_applications || 0}</TableCell>
                        <TableCell>{a.approved_applications || 0}</TableCell>
                        <TableCell>{formatCurrency(a.total_disbursed)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(a.total_collected)}</TableCell>
                        <TableCell>{formatCurrency(a.target)}</TableCell>
                        <TableCell>
                          <Badge variant={pct >= 100 ? 'success' : pct >= 70 ? 'warning' : 'destructive'}>{pct}%</Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-400">No data available</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
