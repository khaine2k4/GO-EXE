import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Sparkles, HelpCircle } from 'lucide-react'

type Message = {
  id: string
  type: 'user' | 'bot'
  text: string
  options?: string[]
}

const FAQ_KNOWLEDGE: Record<string, string> = {
  'rút tiền': 'Tiền của bạn sẽ được chuyển vào Ví (Wallet) sau khi khách hàng xác nhận hoàn tất giao dịch hoặc sau 48h tự động. Từ Ví, bạn có thể tạo lệnh Rút tiền về tài khoản ngân hàng liên kết trong vòng 1-2 ngày làm việc.',
  'đặt cọc': 'PhotoMarket sử dụng hệ thống Escrow an toàn. Khi khách hàng đặt lịch, họ cần thanh toán cọc 30%. Số tiền này do hệ thống giữ và chỉ giải ngân cho Photographer khi đã giao ảnh thành công.',
  'hủy lịch': 'Nếu bạn là Khách hàng: Hủy trước 7 ngày sẽ được hoàn 100% cọc. Hủy sát ngày (dưới 3 ngày) cọc không được hoàn lại.\nNếu bạn là Photographer: Việc hủy lịch sẽ làm giảm điểm uy tín và có thể bị khóa tài khoản nếu tỷ lệ hủy quá cao (trên 15%).',
  'khiếu nại': 'Khách hàng có thể mở khiếu nại (Dispute) nếu hình ảnh nhận được không đạt chất lượng cam kết hoặc vi phạm thời gian giao ảnh trên 3 ngày. Bạn vui lòng vào Chi tiết Booking -> chọn "Khiếu nại booking" để Admin can thiệp xử lý.',
  'gói chụp': 'Photographer có thể tự do tạo và tùy chỉnh các Gói chụp (Photosets) cá nhân. Mức giá thấp nhất phải từ 500.000đ trở lên. Các gói chụp đang có booking chưa hoàn thành sẽ không thể bị xóa.'
}

const INITIAL_OPTIONS = [
  'Khi nào tôi rút được tiền?',
  'Quy định đặt cọc thế nào?',
  'Chính sách hủy lịch ra sao?',
  'Làm sao để khiếu nại?'
]

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

function findAnswer(query: string): string {
  const qStr = query.toLowerCase()
  for (const [key, answer] of Object.entries(FAQ_KNOWLEDGE)) {
    if (qStr.includes(key)) {
      return answer
    }
  }
  return 'Xin lỗi, tôi chưa hiểu rõ câu hỏi của bạn. Vui lòng chọn một trong các chủ đề gợi ý hoặc chia sẻ thêm chi tiết để tôi có thể hỗ trợ tốt hơn!'
}

export default function FAQPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateId(),
      type: 'bot',
      text: 'Xin chào! Tôi là Trợ lý Ảo của PhotoMarket. Tôi có thể giúp gì cho bạn hôm nay?',
      options: INITIAL_OPTIONS
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSend = (text: string) => {
    if (!text.trim()) return

    const userMsg: Message = { id: generateId(), type: 'user', text }
    setMessages(prev => [...prev, userMsg])
    setInputValue('')
    setIsTyping(true)

    // Simulate AI thinking delay
    setTimeout(() => {
      const responseText = findAnswer(text)
      const botMsg: Message = {
        id: generateId(),
        type: 'bot',
        text: responseText,
        options: responseText.includes('Xin lỗi') ? INITIAL_OPTIONS : undefined
      }
      setMessages(prev => [...prev, botMsg])
      setIsTyping(false)
    }, 800 + Math.random() * 600)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend(inputValue)
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl shadow-slate-200/50 overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/50 px-6 py-4">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 shadow-sm">
          <Sparkles className="h-6 w-6 text-white" />
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500"></span>
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-900">Trợ lý Ảo PhotoMarket</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Luôn trực tuyến</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex w-full ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[85%] gap-3 sm:max-w-[75%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex shrink-0 h-8 w-8 items-center justify-center rounded-full ${msg.type === 'user' ? 'bg-slate-900' : 'bg-indigo-100 text-indigo-600 mt-1'}`}>
                  {msg.type === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-5 w-5" />}
                </div>

                {/* Content */}
                <div className={`flex flex-col gap-2 ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${msg.type === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'}`}>
                    {msg.text.split('\n').map((line, i) => <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>)}
                  </div>

                  {/* Options Chips */}
                  {msg.options && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {msg.options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(opt)}
                          className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-1.5 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-100 hover:text-indigo-700 active:scale-95"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex w-full justify-start"
            >
              <div className="flex gap-3 max-w-[85%]">
                <div className="flex shrink-0 h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mt-1">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="rounded-2xl bg-white border border-slate-100 px-5 py-4 rounded-tl-none shadow-sm h-[48px] flex items-center justify-center gap-1.5">
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="h-2 w-2 rounded-full bg-indigo-400" />
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="h-2 w-2 rounded-full bg-indigo-400" />
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="h-2 w-2 rounded-full bg-indigo-400" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-100 bg-white p-4 sm:p-6">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập câu hỏi của bạn (VD: Quy định đặt cọc thế nào?)"
            className="w-full rounded-2xl border-none bg-slate-50 py-4 pl-5 pr-14 text-[13px] font-medium text-slate-900 outline-none ring-1 ring-slate-100 transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
          />
          <button
            onClick={() => handleSend(inputValue)}
            disabled={!inputValue.trim()}
            className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white transition-all hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 active:scale-95"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-center gap-1.5 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <HelpCircle className="h-3.5 w-3.5" />
          Trợ lý ảo có thể mắc sai lầm, vui lòng kiểm tra lại thông tin.
        </div>
      </div>
    </div>
  )
}
