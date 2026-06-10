import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Calendar, MessageSquare, ShieldAlert, Inbox } from 'lucide-react'
import api from '../api/axios'
import { useAppStore } from '../store/AppStore'

interface Notification {
  notificationId: number
  userId: number
  type: string
  title: string
  content: string | null
  refType: string | null
  refId: number | null
  isRead: boolean
  createdAt: string
}

export default function NotificationBell() {
  const { state } = useAppStore()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const user = state.currentUser
  const isPhotographer = user?.role === 'PHOTOGRAPHER'
  const isAdmin = user?.role === 'ADMIN'

  // Fetch notifications list and unread count
  const fetchNotifications = async () => {
    if (!user) return
    try {
      const listRes = await api.get('/notifications?limit=15')
      setNotifications(listRes.data)

      const countRes = await api.get('/notifications/unread-count')
      setUnreadCount(countRes.data.count)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  // Poll for notifications
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 8000) // Poll every 8 seconds
    return () => clearInterval(interval)
  }, [user])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Mark a single notification as read
  const handleMarkAsRead = async (id: number) => {
    try {
      await api.post(`/notifications/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  // Handle notification click and navigation
  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif.notificationId)
    }
    setIsOpen(false)

    if (notif.refType === 'CHAT' && notif.refId) {
      navigate('/chat')
    } else if (notif.refType === 'BOOKING' && notif.refId) {
      if (isAdmin) {
        navigate(`/admin/orders?bookingId=${notif.refId}`)
      } else if (isPhotographer) {
        navigate(`/photographer/bookings/${notif.refId}`)
      } else {
        navigate(`/customer/bookings/${notif.refId}`)
      }
    }
  }

  // Helper to format date nicely
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 6000)

    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${Math.floor(diffMins / 60)} giờ trước`
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  }

  // Helper to render type icons
  const renderIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'CHAT':
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm border border-blue-100">
            <MessageSquare className="h-4 w-4" />
          </div>
        )
      case 'SYSTEM':
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 shadow-sm border border-rose-100">
            <ShieldAlert className="h-4 w-4" />
          </div>
        )
      default:
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100">
            <Calendar className="h-4 w-4" />
          </div>
        )
    }
  }

  if (!user) return null

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition-all duration-300 ${
          isOpen
            ? 'border-[var(--color-azure)] bg-blue-50 text-[var(--color-azure)] scale-105'
            : 'border-[var(--color-border)] bg-white text-[var(--color-graphite)] hover:border-slate-300 hover:text-[var(--color-ink)]'
        }`}
        title="Thông báo"
        aria-label="Thông báo"
      >
        <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'animate-[swing_1s_ease-in-out_infinite]' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white ring-2 ring-white shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-3 w-80 sm:w-96 overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-white shadow-xl max-h-[500px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-4">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-[var(--color-ink)]">Thông báo</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-0">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-3 border border-slate-100">
                  <Inbox className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Hộp thư trống</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto">
                  Bạn không có thông báo nào vào thời điểm hiện tại.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.notificationId}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex gap-3 p-4 cursor-pointer transition hover:bg-slate-50/70 items-start relative ${
                    !notif.isRead ? 'bg-indigo-50/20' : ''
                  }`}
                >
                  {/* Icon */}
                  {renderIcon(notif.type)}

                  {/* Body */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-[13px] leading-snug truncate ${
                        !notif.isRead ? 'font-black text-slate-900' : 'font-bold text-slate-700'
                      }`}>
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-600 shadow-[0_0_6px_#4f46e5]" />
                      )}
                    </div>
                    {notif.content && (
                      <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed line-clamp-2">
                        {notif.content}
                      </p>
                    )}
                    <span className="text-[10px] text-slate-400 font-medium mt-1.5 block">
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
