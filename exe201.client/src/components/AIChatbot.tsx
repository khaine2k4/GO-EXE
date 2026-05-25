import { useState, useEffect, useRef } from 'react'
import { X, Send, Sparkles, Bot, User, CornerDownLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/axios'

interface ChatMessage {
  sender: 'user' | 'bot'
  content: string
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      content: 'Dạ em chào anh/chị! Em là **GO! Assistant** - chuyên viên trợ lý AI thông minh của sàn nhiếp ảnh GO!. Em rất hân hạnh được hỗ trợ anh/chị trải nghiệm dịch vụ hôm nay ạ! 📸✨'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Tự động cuộn xuống dưới cùng khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Hiện tooltip chào mừng sau 3 giây khi vào trang
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleSend = async () => {
    if (!inputValue.trim()) return

    const userText = inputValue.trim()
    setInputValue('')
    
    const newMessages = [...messages, { sender: 'user', content: userText } as ChatMessage]
    setMessages(newMessages)
    setIsLoading(true)
    setShowTooltip(false)

    try {
      const chatHistory = messages.slice(-10).map(m => ({
        sender: m.sender === 'user' ? 'user' : 'bot',
        content: m.content
      }))

      const response = await api.post('/chat/assistant', {
        message: userText,
        history: chatHistory
      })

      const botText = response.data.response || 'Dạ, em chưa tìm được câu trả lời phù hợp nhất. Anh/chị hỏi lại giúp em nha!'
      setMessages(prev => [...prev, { sender: 'bot', content: botText }])
    } catch (error) {
      console.error('Error talking to AI chatbot assistant:', error)
      setMessages(prev => [...prev, {
        sender: 'bot',
        content: 'Dạ, hệ thống đang bận hoặc mạng gặp chút sự cố ạ. Anh/chị vui lòng thử lại sau giây lát nha! 🙏'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const renderMessageContent = (content: string) => {
    let formatted = content.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-pink-300">$1</strong>')
    formatted = formatted.replace(/\n/g, '<br />')
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />
  }

  return (
    <>
      {/* ── Nút kích hoạt Chatbot nổi ở góc màn hình ────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Tooltip nhỏ nhắn, xinh xắn tự động hiện chào mừng */}
        <AnimatePresence>
          {showTooltip && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="mr-3 max-w-[220px] rounded-2xl border border-white/10 bg-slate-950/90 p-3 text-xs text-slate-100 shadow-[0_10px_25px_rgba(0,0,0,0.5)] backdrop-blur-xl"
            >
              <div className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400 flex items-center gap-1.5 mb-1">
                <Sparkles className="h-3 w-3 animate-spin" /> Trợ lý GO! AI
              </div>
              <p className="text-[11px] text-slate-300 leading-normal">
                Dạ, em có thể giúp anh/chị tìm thợ chụp hoặc tư vấn đặt lịch ạ! 📸
              </p>
              <button 
                onClick={() => setShowTooltip(false)}
                className="absolute top-2 right-2 text-slate-500 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => {
            setIsOpen(!isOpen)
            setShowTooltip(false)
          }}
          whileHover={{ scale: 1.1, rotate: 3 }}
          whileTap={{ scale: 0.95 }}
          className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500 text-white shadow-[0_10px_40px_rgba(139,92,246,0.5)] border border-white/20 overflow-hidden"
        >
          {/* Lớp phủ sáng bóng xoay tròn */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:animate-[shimmer_1.5s_infinite] transition-transform" />
          
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-7 w-7" />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <Sparkles className="h-7 w-7 animate-pulse" />
                {/* Chấm tròn báo hiệu online lấp lánh */}
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-indigo-600 shadow-[0_0_8px_#10b981]" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ── Cửa sổ Chat Trợ lý ảo (Chat Drawer) ────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.85 }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            className="fixed bottom-24 right-6 z-50 flex h-[620px] w-[400px] flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/85 backdrop-blur-2xl text-slate-100 shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
          >
            {/* Vòng sáng Neon chuyển động mờ ảo phía sau */}
            <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-violet-600/30 blur-[60px]" />
            <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-pink-600/20 blur-[60px]" />

            {/* Header */}
            <div className="relative flex items-center justify-between bg-white/[0.03] p-6 border-b border-white/5 backdrop-blur-md">
              <div className="flex items-center gap-3.5">
                {/* Avatar bóng bẩy viền kép phát sáng */}
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500 text-white border border-white/20 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                  <Bot className="h-6 w-6 animate-pulse" />
                  <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 shadow-[0_0_6px_#10b981]" />
                </div>
                <div>
                  <h4 className="font-black text-sm tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 uppercase">
                    GO! SMART AI
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[10px] text-slate-400 font-semibold tracking-wide">Trợ lý hỗ trợ 24/7</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Danh sách tin nhắn */}
            <div className="relative flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 items-end ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar thợ ảnh/bot ở góc tin nhắn bot */}
                  {msg.sender === 'bot' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-white/5 shadow-sm">
                      <Bot className="h-4.5 w-4.5 text-violet-400" />
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] rounded-[1.5rem] p-4 text-[13px] leading-relaxed shadow-md transition-all duration-200 ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-white rounded-tr-none border border-white/10 shadow-[0_4px_15px_rgba(99,102,241,0.25)]'
                        : 'bg-white/5 border border-white/10 backdrop-blur-sm text-slate-100 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {renderMessageContent(msg.content)}
                  </div>

                  {/* Avatar người dùng ở góc tin nhắn user */}
                  {msg.sender === 'user' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-700 to-slate-800 border border-white/10 shadow-sm">
                      <User className="h-4.5 w-4.5 text-indigo-300" />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator nghệ thuật */}
              {isLoading && (
                <div className="flex gap-3 items-end justify-start">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-white/5 shadow-sm">
                    <Bot className="h-4.5 w-4.5 text-violet-400 animate-spin" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-[1.5rem] bg-white/5 border border-white/10 p-4 rounded-tl-none shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-gradient-to-tr from-violet-500 to-pink-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 rounded-full bg-gradient-to-tr from-violet-500 to-pink-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 rounded-full bg-gradient-to-tr from-violet-500 to-pink-500 animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar nổi trên nền kính */}
            <div className="relative p-5 border-t border-white/5 bg-slate-950/65 backdrop-blur-xl">
              <div className="relative flex items-center rounded-2.5xl border border-white/10 bg-white/[0.03] p-2 pr-12 focus-within:border-indigo-500/50 focus-within:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all duration-300">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Hỏi GO! Assistant về thợ ảnh Đà Nẵng..."
                  rows={1}
                  className="flex-1 resize-none bg-transparent py-2.5 pl-4 text-[13px] text-white placeholder-slate-500 focus:outline-none scrollbar-none max-h-24 leading-normal"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-500 via-indigo-500 to-pink-500 text-white shadow-lg hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 active:scale-95 border border-white/10"
                  title="Gửi tin nhắn (Enter)"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between px-1 text-[9px] text-slate-500 font-medium">
                <span>GO! Assistant • Gemini 2.5 Intelligence</span>
                <span className="flex items-center gap-1">
                  Nhấn <CornerDownLeft className="h-2.5 w-2.5" /> để gửi
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
