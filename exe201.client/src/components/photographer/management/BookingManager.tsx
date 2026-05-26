import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Eye, Search, XCircle } from 'lucide-react'
import { completeBooking, confirmBooking, getBookings, markInProgress, rejectBooking, type BookingDto } from '../../../services/bookingApi'
import { useToast } from '../../Toast'
import { formatDate, formatDateTime, formatVnd } from '../format'
import { Drawer, EmptyState, SectionPanel } from './Panel'

const statuses = ['ALL', 'PENDING_PAYMENT', 'PENDING_CONFIRMATION', 'CONFIRMED', 'IN_PROGRESS', 'AWAITING_CUSTOMER', 'COMPLETED', 'CANCELLED', 'REJECTED']

const statusStyle: Record<string, string> = {
  PENDING_PAYMENT: 'bg-amber-50 text-amber-700',
  PENDING_CONFIRMATION: 'bg-blue-50 text-blue-700',
  CONFIRMED: 'bg-indigo-50 text-indigo-700',
  IN_PROGRESS: 'bg-yellow-50 text-yellow-700',
  AWAITING_CUSTOMER: 'bg-cyan-50 text-cyan-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
  REJECTED: 'bg-rose-50 text-rose-700',
}

export default function BookingManager({ initialBooking, onChanged }: { initialBooking?: BookingDto | null; onChanged?: () => void }) {
  const toast = useToast()
  const [bookings, setBookings] = useState<BookingDto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [selected, setSelected] = useState<BookingDto | null>(initialBooking ?? null)
  const [actionLoading, setActionLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setBookings(await getBookings())
    } catch {
      toast.push({ type: 'error', title: 'Could not load bookings' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (initialBooking) setSelected(initialBooking) }, [initialBooking])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return bookings.filter((item) => {
      const statusMatch = status === 'ALL' || item.status === status
      const textMatch = !term || `${item.bookingCode} ${item.customerName} ${item.packageName} ${item.shootingLocation}`.toLowerCase().includes(term)
      return statusMatch && textMatch
    })
  }, [bookings, search, status])

  async function runAction(action: () => Promise<BookingDto>, title: string) {
    setActionLoading(true)
    try {
      const updated = await action()
      toast.push({ type: 'success', title })
      setSelected(updated)
      await load()
      onChanged?.()
    } catch {
      toast.push({ type: 'error', title: 'Action failed' })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <SectionPanel title="Bookings" subtitle="Search, filter, inspect, and move bookings through the studio workflow.">
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto]">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search booking, customer, package, location..." className="h-11 min-w-0 flex-1 outline-none" />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold">
            {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        {loading ? <EmptyState text="Loading bookings..." /> : filtered.length === 0 ? <EmptyState text="No matching booking." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead><tr className="border-b border-slate-100 text-xs font-black uppercase tracking-widest text-slate-400"><th className="py-3">Booking</th><th>Customer</th><th>Package</th><th>Shooting date</th><th>Revenue</th><th>Status</th><th className="text-right">Action</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td className="py-4 font-mono text-xs font-black text-slate-600">#{item.bookingCode}</td>
                    <td><div className="font-black text-slate-950">{item.customerName}</div><div className="text-xs text-slate-500">{item.shootingLocation || 'Studio'}</div></td>
                    <td className="text-sm font-semibold text-slate-600">{item.packageName}</td>
                    <td className="text-sm font-semibold text-slate-600">{formatDate(item.shootingDate)} / {item.startTime}</td>
                    <td className="text-sm font-black text-indigo-600">{formatVnd(item.studioRevenue)}</td>
                    <td><span className={`rounded-xl px-3 py-2 text-xs font-black uppercase ${statusStyle[item.status] ?? 'bg-slate-100 text-slate-600'}`}>{item.status}</span></td>
                    <td className="text-right"><button type="button" onClick={() => setSelected(item)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black uppercase text-slate-600"><Eye className="h-4 w-4" />Detail</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionPanel>

      <Drawer title={selected ? `Booking #${selected.bookingCode}` : 'Booking detail'} open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-slate-50 p-4">
              <span className={`rounded-xl px-3 py-2 text-xs font-black uppercase ${statusStyle[selected.status] ?? 'bg-slate-100 text-slate-600'}`}>{selected.status}</span>
              <h3 className="mt-4 text-xl font-black text-slate-950">{selected.customerName}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">{selected.packageName}</p>
            </div>
            <Detail label="Date" value={`${formatDate(selected.shootingDate)} ${selected.startTime} - ${selected.endTime}`} />
            <Detail label="Location" value={selected.shootingLocation || 'Studio'} />
            <Detail label="Total price" value={formatVnd(selected.totalPrice)} />
            <Detail label="Commission" value={formatVnd(selected.commissionAmount)} />
            <Detail label="Studio revenue" value={formatVnd(selected.studioRevenue)} />
            <Detail label="Created" value={formatDateTime(selected.createdAt)} />
            {selected.note && <div className="rounded-xl border border-slate-200 p-4 text-sm font-semibold text-slate-600">{selected.note}</div>}
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-5">
              {selected.status === 'PENDING_CONFIRMATION' && (
                <>
                  <button disabled={actionLoading} type="button" onClick={() => runAction(() => confirmBooking(selected.id), 'Booking confirmed')} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black uppercase text-white"><CheckCircle2 className="h-4 w-4" />Confirm</button>
                  <button disabled={actionLoading} type="button" onClick={() => { const reason = prompt('Reject reason?') || undefined; runAction(() => rejectBooking(selected.id, reason), 'Booking rejected') }} className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 px-4 text-xs font-black uppercase text-rose-600"><XCircle className="h-4 w-4" />Reject</button>
                </>
              )}
              {selected.status === 'CONFIRMED' && <button disabled={actionLoading} type="button" onClick={() => runAction(() => markInProgress(selected.id), 'Booking started')} className="h-10 rounded-xl bg-indigo-600 px-4 text-xs font-black uppercase text-white">Start shoot</button>}
              {selected.status === 'IN_PROGRESS' && <button disabled={actionLoading} type="button" onClick={() => runAction(() => completeBooking(selected.id), 'Sent to customer confirmation')} className="h-10 rounded-xl bg-emerald-600 px-4 text-xs font-black uppercase text-white">Send completion</button>}
              {selected.status === 'AWAITING_CUSTOMER' && <span className="rounded-xl bg-cyan-50 px-4 py-3 text-xs font-black uppercase text-cyan-700">Waiting for customer confirmation</span>}
            </div>
          </div>
        )}
      </Drawer>
    </>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3"><span className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</span><span className="text-right text-sm font-black text-slate-800">{value}</span></div>
}
