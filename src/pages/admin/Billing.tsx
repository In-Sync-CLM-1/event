import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Wallet, Plus, TrendingUp, TrendingDown, RefreshCw,
  AlertTriangle, CheckCircle, IndianRupee, Clock,
  CreditCard, ArrowUpRight, ArrowDownLeft, Loader2,
  ShieldCheck, Receipt,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BillingAccount {
  balance: number;
  total_credited: number;
  total_debited: number;
  plan: 'free_trial' | 'pro';
  trial_events_used: number;
  user_count: number;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  category: string;
  amount: number;
  balance_after: number;
  description: string;
  reference_id: string | null;
  created_at: string;
}

// ── Razorpay global type ──────────────────────────────────────────────────────

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PRESETS = [500, 1000, 2000, 5000];
const RATE_PER_USER = 199;
const LOW_BALANCE_THRESHOLD = 300;

function fmt(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2,
  }).format(amount);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

async function callBilling(action: string, payload: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/billing`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ action, ...payload }),
    },
  );
  return res.json();
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// ── Add Funds Dialog ──────────────────────────────────────────────────────────

function AddFundsDialog({
  open, onOpenChange, onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  async function handlePay() {
    const num = Number(amount);
    if (!num || num < 500) {
      toast({ title: 'Minimum recharge is ₹500', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Failed to load Razorpay SDK');

      // 1. Create order
      const order = await callBilling('create_order', { amount: num });
      if (order.error) throw new Error(order.error);

      // 2. Open Razorpay checkout
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key:         order.razorpay_key_id,
          amount:      order.amount,
          currency:    order.currency,
          order_id:    order.order_id,
          name:        'Event-Sync',
          description: 'Wallet Recharge',
          prefill: {
            name:  profile?.full_name || '',
            email: user?.email || '',
          },
          theme: { color: '#2563eb' },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              // 3. Verify + credit wallet
              const verify = await callBilling('verify_payment', {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_signature:  response.razorpay_signature,
                amount:              order.amount,
              });
              if (verify.error) throw new Error(verify.error);
              resolve();
            } catch (e) {
              reject(e);
            }
          },
          modal: {
            ondismiss: () => reject(new Error('dismissed')),
          },
        });
        rzp.open();
      });

      toast({ title: `₹${num.toLocaleString('en-IN')} added to wallet!` });
      onSuccess();
      onOpenChange(false);
      setAmount('');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Payment failed';
      if (message !== 'dismissed') {
        toast({ title: 'Payment failed', description: message, variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Funds to Wallet</DialogTitle>
          <DialogDescription>
            Minimum ₹500 · Instant credit via Razorpay
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Preset amounts */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Quick amounts</p>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setAmount(String(p))}
                  className={`rounded-lg border py-2 text-sm font-medium transition-colors ${
                    amount === String(p)
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/50 hover:bg-muted'
                  }`}
                >
                  ₹{p.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Or enter custom amount</p>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                min={500}
                placeholder="500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9"
              />
            </div>
            {Number(amount) > 0 && Number(amount) < 500 && (
              <p className="text-xs text-destructive mt-1">Minimum recharge is ₹500</p>
            )}
          </div>

          {/* Summary */}
          {Number(amount) >= 500 && (
            <div className="rounded-xl bg-muted/50 border p-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">₹{Number(amount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Processing fee</span>
                <span className="text-emerald-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between border-t pt-1.5 font-semibold">
                <span>Total charged</span>
                <span>₹{Number(amount).toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          <Button
            className="w-full"
            onClick={handlePay}
            disabled={loading || !amount || Number(amount) < 500}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…</>
            ) : (
              <><CreditCard className="h-4 w-4 mr-2" /> Pay with Razorpay</>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Secured by Razorpay · UPI, Cards, Net Banking accepted
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Billing() {
  const [account, setAccount]       = useState<BillingAccount | null>(null);
  const [transactions, setTxns]     = useState<Transaction[]>([]);
  const [txTotal, setTxTotal]       = useState(0);
  const [txPage, setTxPage]         = useState(1);
  const [loadingAcct, setLoadingAcct] = useState(true);
  const [loadingTxns, setLoadingTxns] = useState(true);
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const { toast } = useToast();

  const fetchAccount = useCallback(async () => {
    setLoadingAcct(true);
    const data = await callBilling('get_balance');
    if (data.error) {
      toast({ title: 'Failed to load billing info', description: data.error, variant: 'destructive' });
    } else {
      setAccount(data);
    }
    setLoadingAcct(false);
  }, [toast]);

  const fetchTransactions = useCallback(async (page = 1) => {
    setLoadingTxns(true);
    const data = await callBilling('get_transactions', { page, limit: 20 });
    if (!data.error) {
      setTxns(data.transactions ?? []);
      setTxTotal(data.total ?? 0);
      setTxPage(page);
    }
    setLoadingTxns(false);
  }, []);

  useEffect(() => {
    fetchAccount();
    fetchTransactions(1);
  }, [fetchAccount, fetchTransactions]);

  const monthlyEstimate = (account?.user_count ?? 1) * RATE_PER_USER;
  const isLowBalance = (account?.balance ?? 0) < LOW_BALANCE_THRESHOLD;
  const totalPages = Math.ceil(txTotal / 20);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Billing</h1>
            <p className="text-muted-foreground mt-1">Manage your wallet and subscription</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { fetchAccount(); fetchTransactions(1); }}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button onClick={() => setAddFundsOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Funds
            </Button>
          </div>
        </div>

        {/* Low balance warning */}
        {!loadingAcct && isLowBalance && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Low wallet balance</p>
              <p className="text-amber-700 text-sm mt-0.5">
                Your balance is {fmt(account?.balance ?? 0)}. Add funds to ensure uninterrupted service.
              </p>
            </div>
            <Button size="sm" className="ml-auto flex-shrink-0 bg-amber-600 hover:bg-amber-700 text-white border-0"
              onClick={() => setAddFundsOpen(true)}>
              Add Funds
            </Button>
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Wallet balance */}
          <Card className="sm:col-span-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Wallet Balance</p>
                  {loadingAcct ? (
                    <div className="h-10 w-36 bg-muted animate-pulse rounded mt-2" />
                  ) : (
                    <p className={`text-4xl font-extrabold mt-1 tracking-tight ${
                      isLowBalance ? 'text-amber-600' : 'text-foreground'
                    }`}>
                      {fmt(account?.balance ?? 0)}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                {account?.plan === 'free_trial' ? (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                    Free Trial · {2 - (account.trial_events_used ?? 0)} events left
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                    <CheckCircle className="h-3 w-3 mr-1" /> Pro Plan
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Total credited */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">Total Credited</p>
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              </div>
              {loadingAcct ? (
                <div className="h-8 w-28 bg-muted animate-pulse rounded" />
              ) : (
                <p className="text-2xl font-bold text-emerald-600">{fmt(account?.total_credited ?? 0)}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Lifetime recharges</p>
            </CardContent>
          </Card>

          {/* Monthly estimate */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">Monthly Est.</p>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              {loadingAcct ? (
                <div className="h-8 w-28 bg-muted animate-pulse rounded" />
              ) : (
                <p className="text-2xl font-bold">{fmt(monthlyEstimate)}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {account?.user_count ?? 1} user{(account?.user_count ?? 1) > 1 ? 's' : ''} × ₹{RATE_PER_USER}/mo
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Subscription info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4" /> Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Plan</p>
                {loadingAcct ? (
                  <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                ) : (
                  <p className="font-semibold text-foreground capitalize">
                    {account?.plan === 'free_trial' ? 'Free Trial' : 'Pro'}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Rate</p>
                <p className="font-semibold">₹{RATE_PER_USER} / user / month</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Includes</p>
                <ul className="text-sm text-muted-foreground space-y-0.5">
                  {[
                    'Unlimited events',
                    'Unlimited attendees',
                    'QR check-in, certificates',
                    'Gamification & analytics',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-1.5">
                      <CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction history */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Transaction History
              </CardTitle>
              <p className="text-sm text-muted-foreground">{txTotal} transactions</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingTxns ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Wallet className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No transactions yet</p>
                <p className="text-sm mt-1">Add funds to get started</p>
              </div>
            ) : (
              <>
                {/* Table header */}
                <div className="hidden sm:grid grid-cols-[1fr_120px_120px_120px_160px] gap-4 px-6 py-3 bg-muted/40 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <div>Description</div>
                  <div>Category</div>
                  <div className="text-right">Amount</div>
                  <div className="text-right">Balance After</div>
                  <div className="text-right">Date</div>
                </div>

                <div className="divide-y">
                  {transactions.map((tx) => (
                    <div key={tx.id}
                      className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_120px_160px] gap-2 sm:gap-4 px-6 py-4 items-center hover:bg-muted/20 transition-colors">
                      {/* Description */}
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          tx.type === 'credit'
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-red-100 text-red-500'
                        }`}>
                          {tx.type === 'credit'
                            ? <ArrowUpRight className="h-4 w-4" />
                            : <ArrowDownLeft className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{tx.description}</p>
                          {tx.reference_id && (
                            <p className="text-xs text-muted-foreground truncate">{tx.reference_id}</p>
                          )}
                        </div>
                      </div>

                      {/* Category */}
                      <div>
                        <span className={`inline-flex text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          tx.category === 'topup'
                            ? 'bg-emerald-50 text-emerald-700'
                            : tx.category === 'subscription'
                            ? 'bg-blue-50 text-blue-700'
                            : tx.category === 'adjustment'
                            ? 'bg-violet-50 text-violet-700'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {tx.category}
                        </span>
                      </div>

                      {/* Amount */}
                      <div className={`text-sm font-semibold sm:text-right ${
                        tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {tx.type === 'credit' ? '+' : '−'}{fmt(tx.amount)}
                      </div>

                      {/* Balance after */}
                      <div className="text-sm text-muted-foreground sm:text-right">
                        {fmt(tx.balance_after)}
                      </div>

                      {/* Date */}
                      <div className="text-xs text-muted-foreground sm:text-right">
                        {fmtDate(tx.created_at)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Page {txPage} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm"
                        disabled={txPage <= 1}
                        onClick={() => fetchTransactions(txPage - 1)}>
                        Previous
                      </Button>
                      <Button variant="outline" size="sm"
                        disabled={txPage >= totalPages}
                        onClick={() => fetchTransactions(txPage + 1)}>
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Pricing note */}
        <Card className="border-dashed">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <IndianRupee className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Simple, transparent pricing</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  ₹{RATE_PER_USER}/user/month · Unlimited events · Unlimited attendees ·
                  No platform fee · No per-event charges
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Payments secured by Razorpay
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AddFundsDialog
        open={addFundsOpen}
        onOpenChange={setAddFundsOpen}
        onSuccess={() => { fetchAccount(); fetchTransactions(1); }}
      />
    </AdminLayout>
  );
}
