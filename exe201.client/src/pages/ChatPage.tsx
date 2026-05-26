import { useEffect, useRef, useState } from 'react'
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { Send, MessageCircle, ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { useAppStore } from '../store/AppStore'
import { useToast } from '../components/Toast'
import api from '../api/axios'

// ── Types ─────────────────────────────────────────────────────────────────────
interface ConversationDto {
  conversationId: number
  customerId: number
  customerName: string
  customerAvatarUrl?: string
  studioId: number
  studioName: string
  studioLogoUrl?: string
  lastMessage?: string
  lastMessageAt?: string
  unreadCount: number
}

interface MessageDto {
  messageId: number
  conversationId: number
  senderId: number
  senderName: string
  senderAvatarUrl?: string
  content: string
  isRead: boolean
  createdAt: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function Avatar({ name, url, size = 8 }: { name: string; url?: string; size?: number }) {
  const cls = `h-${size} w-${size} rounded-full object-cover flex-shrink-0`
  return url
    ? <img src={url} alt={name} className={cls} />
    : <span className={`${cls} flex items-center justify-center bg-blue-50 text-[var(--color-azure)] font-bold text-sm`}>{name[0]}</span>
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { state } = useAppStore()
  const toast = useToast()
  const currentUser = state.currentUser!
  const [searchParams] = useSearchParams()

  const [conversations, setConversations] = useState<ConversationDto[]>([])
  const [activeConv, setActiveConv] = useState<ConversationDto | null>(null)
  const [messages, setMessages] = useState<MessageDto[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showList, setShowList] = useState(true) // mobile toggle

  const connectionRef = useRef<HubConnection | null>(null)
  const activeConvRef = useRef<ConversationDto | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const creatingRef = useRef<string | null>(null)

  // Keep activeConvRef updated
  useEffect(() => {
    activeConvRef.current = activeConv
  }, [activeConv])

  const [loadError, setLoadError] = useState('')

  // ── Load danh sách conversation khi vào trang ─────────────────────────────
  useEffect(() => {
    setLoadError('')
    api.get<ConversationDto[]>('/chat/conversations')
      .then(async (r) => {
        const list = r.data
        setConversations(list)

        // Check query params
        const studioId = searchParams.get('studioId')
        const customerId = searchParams.get('customerId')
        const bookingId = searchParams.get('bookingId')

        if (studioId) {
          // Find existing conversation in the loaded list
          let found = list.find((c) => {
            const matchStudio = c.studioId === Number(studioId)
            const matchCustomer = customerId ? c.customerId === Number(customerId) : true
            return matchStudio && matchCustomer
          })

          if (!found) {
            // Check ref lock to prevent duplicate concurrent API calls
            if (creatingRef.current === studioId) return
            creatingRef.current = studioId

            // If not found, let's create a new conversation
            try {
              const res = await api.post<ConversationDto>('/chat/conversations', {
                studioId: Number(studioId),
                customerId: customerId ? Number(customerId) : undefined,
                bookingId: bookingId ? Number(bookingId) : undefined
              })
              found = res.data
              setConversations((prev) => {
                if (prev.some(c => c.conversationId === res.data.conversationId)) return prev
                return [res.data, ...prev]
              })
            } catch (err: any) {
              console.error('Failed to create/fetch conversation', err)
              const msg = err.response?.data ? (typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data)) : err.message
              setLoadError(`Không thể tạo hội thoại: ${msg}`)
            } finally {
              creatingRef.current = null
            }
          }

          if (found) {
            openConversation(found)
          }
        }
      })
      .catch((err: any) => {
        console.error('Failed to load conversations', err)
        const msg = err.response?.data ? (typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data)) : err.message
        setLoadError(`Không thể tải tin nhắn: ${msg}`)
      })
  }, [searchParams])

  // ── Kết nối SignalR ───────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token')
    const conn = new HubConnectionBuilder()
      .withUrl(`http://localhost:5289/hubs/chat?access_token=${token}`, {
        withCredentials: true
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    conn.on('ReceiveMessage', (msg: MessageDto) => {
      // Chỉ thêm vào nếu đang mở đúng conversation
      setMessages(prev => {
        if (prev.length === 0 || prev[0].conversationId === msg.conversationId) {
          return [...prev, msg]
        }
        return prev
      })
      // Cập nhật lastMessage trong danh sách
      setConversations(prev => prev.map(c =>
        c.conversationId === msg.conversationId
          ? { ...c, lastMessage: msg.content, lastMessageAt: msg.createdAt }
          : c
      ))
    })

    conn.start().then(() => {
      connectionRef.current = conn
      // Auto join if activeConv is already selected
      if (activeConvRef.current) {
        conn.invoke('JoinConversation', String(activeConvRef.current.conversationId)).catch(console.error)
      }
    }).catch(console.error)

    return () => { conn.stop() }
  }, [])

  // ── Khi chọn conversation: load lịch sử + join room ──────────────────────
  async function openConversation(conv: ConversationDto) {
    // Rời phòng cũ
    if (activeConvRef.current && connectionRef.current && connectionRef.current.state === 'Connected') {
      try {
        await connectionRef.current.invoke('LeaveConversation', String(activeConvRef.current.conversationId))
      } catch (err) {
        console.error('Failed to leave conversation group', err)
      }
    }

    setActiveConv(conv)
    setMessages([])
    setShowList(false) // mobile: ẩn list, hiện chat

    // Load lịch sử
    const r = await api.get<MessageDto[]>(`/chat/conversations/${conv.conversationId}/messages`)
    setMessages(r.data)

    // Join phòng mới để nhận realtime
    if (connectionRef.current && connectionRef.current.state === 'Connected') {
      try {
        await connectionRef.current.invoke('JoinConversation', String(conv.conversationId))
      } catch (err) {
        console.error('Failed to join conversation group', err)
      }
    }

    // Reset unread
    setConversations(prev => prev.map(c =>
      c.conversationId === conv.conversationId ? { ...c, unreadCount: 0 } : c
    ))
  }

  // ── Gửi tin nhắn ─────────────────────────────────────────────────────────
  async function sendMessage() {
    if (!text.trim() || !activeConv || sending) return
    setSending(true)
    try {
      await api.post(`/chat/conversations/${activeConv.conversationId}/messages`, {
        studioId: activeConv.studioId,
        content: text.trim()
      })
      setText('')
    } catch (err: any) {
      console.error('Failed to send message', err)
      const msg = err.response?.data ? (typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data)) : err.message
      toast.push({
        type: 'error',
        title: 'Gửi tin nhắn thất bại',
        message: msg
      })
    } finally {
      setSending(false)
    }
  }

  // ── Scroll xuống dưới khi có tin mới ─────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-5rem)] overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]">

      {/* ── Sidebar: Danh sách cuộc trò chuyện ── */}
      <div className={`${showList ? 'flex' : 'hidden'} md:flex w-full md:w-80 flex-col border-r border-[var(--color-border)] bg-[var(--color-fog)]`}>
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4">
          <MessageCircle className="h-5 w-5 text-[var(--color-azure)]" />
          <span className="font-semibold text-[var(--color-ink)]">Tin nhắn</span>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loadError && (
            <div className="m-3 rounded-xl bg-rose-50 p-4 text-xs font-semibold text-rose-600 border border-rose-100 leading-relaxed">
              ⚠️ {loadError}
            </div>
          )}
          {conversations.length === 0 && !loadError && (
            <div className="p-6 text-center text-sm text-slate-400">Chưa có cuộc trò chuyện nào</div>
          )}
          {conversations.map(conv => {
            const isOwner = currentUser.role === 'PHOTOGRAPHER'
            const displayName = isOwner ? conv.customerName : conv.studioName
            const displayAvatar = isOwner ? conv.customerAvatarUrl : conv.studioLogoUrl
            const isActive = activeConv?.conversationId === conv.conversationId

            return (
              <button
                key={conv.conversationId}
                onClick={() => openConversation(conv)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white ${isActive ? 'border-r-2 border-[var(--color-azure)] bg-white' : ''}`}
              >
                <Avatar name={displayName} url={displayAvatar} size={10} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-semibold text-slate-800">{displayName}</span>
                    {conv.unreadCount > 0 && (
                      <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-azure)] px-1.5 text-[10px] font-bold text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <p className="mt-0.5 truncate text-xs text-slate-400">{conv.lastMessage}</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Panel: Khu vực chat ── */}
      <div className={`${!showList ? 'flex' : 'hidden'} md:flex flex-1 flex-col`}>

        {/* Chưa chọn conversation */}
        {!activeConv ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400">
            <MessageCircle className="h-12 w-12 opacity-30" />
            <p className="text-sm font-medium">Chọn cuộc trò chuyện để bắt đầu</p>
          </div>
        ) : (
          <>
            {/* Header chat */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
              <button
                className="md:hidden mr-1 text-slate-400 hover:text-slate-700"
                onClick={() => setShowList(true)}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <Avatar
                name={currentUser.role === 'PHOTOGRAPHER' ? activeConv.customerName : activeConv.studioName}
                url={currentUser.role === 'PHOTOGRAPHER' ? activeConv.customerAvatarUrl : activeConv.studioLogoUrl}
                size={9}
              />
              <div>
                <div className="font-bold text-slate-900 text-sm">
                  {currentUser.role === 'PHOTOGRAPHER' ? activeConv.customerName : activeConv.studioName}
                </div>
                <div className="text-[11px] text-slate-400">
                  {currentUser.role === 'PHOTOGRAPHER' ? 'Khách hàng' : activeConv.studioName}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              <AnimatePresence initial={false}>
                {messages.map(msg => {
                  const isMine = msg.senderId === Number(currentUser.id)
                  return (
                    <motion.div
                      key={msg.messageId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {!isMine && <Avatar name={msg.senderName} url={msg.senderAvatarUrl} size={7} />}
                      <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          isMine
                            ? 'bg-[var(--color-azure)] text-white rounded-br-sm'
                            : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-slate-400 px-1">{formatTime(msg.createdAt)}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {/* Input gửi tin */}
            <div className="border-t border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-fog)] px-4 py-2 transition focus-within:border-[var(--color-azure)] focus-within:ring-2 focus-within:ring-blue-500/10">
                <input
                  type="text"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
                <button
                  onClick={sendMessage}
                  disabled={!text.trim() || sending}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-azure)] text-white transition hover:bg-[var(--color-azure-dark)] disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-slate-400">Enter để gửi</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
