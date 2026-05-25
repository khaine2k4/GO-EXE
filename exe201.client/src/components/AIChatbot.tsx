import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/axios'

interface ChatMessage {
  sender: 'user' | 'bot'
  content: string
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      content: 'Dạ em chào anh/chị! Em là **GO! Assistant** - trợ lý thông minh của sàn nhiếp ảnh GO!. Em có thể giúp gì cho anh/chị hôm nay ạ? 📸✨'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Tự động cuộn xuống dưới cùng khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = async () => {
    if (!inputValue.trim()) return

    const userText = inputValue.trim()
    setInputValue('')
    
    // Thêm tin nhắn của user vào danh sách hiển thị
    const newMessages = [...messages, { sender: 'user', content: userText } as ChatMessage]
    setMessages(newMessages)
    setIsLoading(true)

    try {
      // Map lịch sử trò chuyện sang định dạng DTO (chỉ lấy tối đa 10 tin nhắn gần nhất để tối ưu hiệu năng)
      const chatHistory = messages.slice(-10).map(m => ({
        sender: m.sender === 'user' ? 'user' : 'bot',
        content: m.content
      }))

      const response = await api.post('/chat/assistant', {
        message: userText,
        history: chatHistory
      })

      const botText = response.data.response || 'Dạ, em gặp một chút sự cố khi xử lý câu trả lời. Anh/chị hỏi lại giúp em nha!'
      
      setMessages(prev => [...prev, { sender: 'bot', content: botText }])
    } catch (error) {
      console.error('Error talking to AI chatbot assistant:', error)
      setMessages(prev => [...prev, {
        sender: 'bot',
        content: 'Dạ, kết nối mạng đang bị gián đoạn một chút. Anh/chị kiểm tra lại mạng hoặc thử lại sau nha! 🙏'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // Hỗ trợ Enter để gửi tin nhắn
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Hàm chuyển đổi nội dung markdown đơn giản sang HTML (dành cho in đậm và ngắt dòng)
  const renderMessageContent = (content: string) => {
    // Thay thế **text** thành <strong>text</strong>
    let formatted = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Thay thế dấu xuống dòng thành <br />
    formatted = formatted.replace(/\n/g, '<br />')
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />
  }

  return (
    <>
      {/* ── Nút kích hoạt Chatbot nổi ở góc màn hình ────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-[0_8px_30px_rgb(99,102,241,0.4)] transition-all hover:shadow-[0_8px_30px_rgb(99,102,241,0.6)] border border-white/20"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-6 w-6" />
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
                <MessageCircle className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 flex h-3. w-3. rounded-full bg-emerald-500 border-2 border-indigo-600 animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ── Cửa sổ Chat Trợ lý ảo (Chat Drawer) ────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-24 right-6 z-50 flex h-[550px] w-96 flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/90 backdrop-blur-2xl text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
          >
            {/* Header */}
            <div className="relative flex items-center gap-3 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 p-5 border-b border-white/10 backdrop-blur-md">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-500 text-white border border-white/20">
                <Sparkles className="h-5 w-5 animate-pulse" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight text-white tracking-wide">GO! Assistant</h4>
                <p className="text-[10px] text-slate-400 font-medium">Trợ lý ảo AI thông minh</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-5 right-5 rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Danh sách tin nhắn */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white rounded-tr-none border border-white/10'
                        : 'bg-slate-800/80 border border-slate-700/50 text-slate-100 rounded-tl-none'
                    }`}
                  >
                    {renderMessageContent(msg.content)}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl bg-slate-800/80 border border-slate-700/50 p-4 rounded-tl-none">
                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-white/10 bg-slate-900/60 backdrop-blur-md">
              <div className="relative flex items-center rounded-2xl border border-white/10 bg-slate-950/40 p-1.5 focus-within:border-indigo-500/50 transition-all">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tin nhắn..."
                  rows={1}
                  className="flex-1 resize-none bg-transparent py-2 pl-3 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none scrollbar-none max-h-24"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 border border-white/10"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-center text-[9px] text-slate-500">
                GO! Assistant sử dụng mô hình trí tuệ nhân tạo Gemini 2.5
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
