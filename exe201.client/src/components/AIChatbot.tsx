import { useState, useEffect, useRef } from 'react'
import { X, Send, Sparkles, Bot, CornerDownLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

interface ChatMessage {
  sender: 'user' | 'bot'
  content: string
}

const formatMarkdown = (text: string): string => {
  let formatted = text;
  
  // Table parser: Find markdown table blocks and convert them to HTML <table> without \n
  const lines = formatted.split(/\r?\n/);
  let inTable = false;
  let tableHtml = '';
  let newLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableHtml = '<div class="overflow-x-auto my-3 rounded-xl border border-slate-200 bg-white shadow-sm"><table class="min-w-full divide-y divide-slate-100 text-left text-[11px] bg-white">';
      }
      
      const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      const isSeparator = cells.every(c => c.match(/^:?-+:?$/));
      
      if (isSeparator) {
        continue;
      }
      
      const isHeader = tableHtml.includes('<thead>') === false && !tableHtml.includes('<tbody>');
      if (isHeader) {
        tableHtml += '<thead class="bg-indigo-50/50 font-black text-indigo-700"><tr>';
        cells.forEach(c => {
          tableHtml += `<th class="px-2.5 py-1.5 border-b border-slate-200 font-extrabold text-[11px]">${c}</th>`;
        });
        tableHtml += '</tr></thead><tbody class="divide-y divide-slate-100 text-slate-700">';
      } else {
        tableHtml += '<tr class="hover:bg-slate-50/50 transition-colors">';
        cells.forEach(c => {
          tableHtml += `<td class="px-2.5 py-1.5 font-medium whitespace-nowrap">${c}</td>`;
        });
        tableHtml += '</tr>';
      }
    } else {
      if (inTable) {
        tableHtml += '</tbody></table></div>';
        newLines.push(tableHtml);
        inTable = false;
        tableHtml = '';
      }
      newLines.push(lines[i]);
    }
  }
  if (inTable) {
    tableHtml += '</tbody></table></div>';
    newLines.push(tableHtml);
  }
  formatted = newLines.join('\n');

  // 1. Dấu gạch ngang phân cách (horizontal rule)
  formatted = formatted.replace(/---\s*(?:\r?\n|$)/g, '<hr class="my-3 border-slate-200/60" />');
  
  // 2. Tiêu đề headings
  formatted = formatted.replace(/^###\s*(.*?)(?:\r?\n|$)/gm, '<h4 class="font-black text-xs text-indigo-700 mt-2.5 mb-1 uppercase tracking-wider">$1</h4>');
  formatted = formatted.replace(/^##\s*(.*?)(?:\r?\n|$)/gm, '<h3 class="font-extrabold text-sm text-indigo-800 mt-3 mb-1.5">$1</h3>');
  formatted = formatted.replace(/^#\s*(.*?)(?:\r?\n|$)/gm, '<h2 class="font-black text-base text-indigo-900 mt-4 mb-2 border-b pb-1">$1</h2>');
  
  // 3. Chữ in đậm
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-indigo-600">$1</strong>');
  
  // 4. Danh sách gạch đầu dòng (bullet points)
  formatted = formatted.replace(/^\s*[\-\*]\s*(.*?)(?:\r?\n|$)/gm, '<span class="inline-block pl-1.5 py-0.5 text-slate-700">• $1</span><br />');
  
  // 5. Xuống dòng thông thường
  formatted = formatted.replace(/\r?\n/g, '<br />');
  
  // 6. Dọn dẹp các thẻ br thừa sau các block tag (kể cả div bao table)
  formatted = formatted.replace(/(<\/h2>|<\/h3>|<\/h4>|<hr class="my-3 border-slate-200\/60" \/>|<\/div>)<br \/>/g, '$1');
  
  return formatted;
};

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
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Tự động cuộn xuống dưới cùng khi có tin nhắn mới (cuộn cục bộ, tránh trôi trang chính)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
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
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  // Hàm chuyển đổi nội dung tin nhắn và tự động bóc tách Thẻ Tương Tác (Visual Card) kèm hình ảnh thực tế
  const renderMessageContent = (content: string) => {
    const cardRegex = /\[CARD:\s*(.*?)\s*\]/g;
    
    const parts: { type: 'text' | 'card'; content?: string; data?: any }[] = []
    let lastIndex = 0
    let match

    cardRegex.lastIndex = 0
    while ((match = cardRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index)
        })
      }

      const cardContent = match[1];
      const pairs = cardContent.split('|').map(p => p.trim());
      const cardData: any = {};
      pairs.forEach(pair => {
        const eqIdx = pair.indexOf('=');
        if (eqIdx !== -1) {
          const key = pair.substring(0, eqIdx).trim();
          const val = pair.substring(eqIdx + 1).trim();
          cardData[key] = val;
        }
      });

      parts.push({
        type: 'card',
        data: {
          studioId: cardData.studioId || '',
          serviceId: cardData.serviceId || '',
          name: (cardData.name || '').trim(),
          serviceName: (cardData.serviceName || '').trim(),
          rating: (cardData.rating || '').trim(),
          priceRange: (cardData.priceRange || '').trim(),
          thumbnail: (cardData.thumbnail || '').trim()
        }
      })

      lastIndex = cardRegex.lastIndex
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex)
      })
    }

    if (parts.length === 0) {
      let formatted = formatMarkdown(content)
      return <span dangerouslySetInnerHTML={{ __html: formatted }} className="text-[14px] leading-relaxed block w-full text-left" />
    }

    return (
      <div className="space-y-3.5 w-full text-left">
        {parts.map((part, pIdx) => {
          if (part.type === 'text') {
            let formatted = formatMarkdown(part.content!)
            return <p key={pIdx} dangerouslySetInnerHTML={{ __html: formatted }} className="text-[14px] leading-relaxed" />
          } else {
            const card = part.data
            const defaultThumbnail = "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=400&auto=format&fit=crop"
            const finalThumbnail = card.thumbnail && card.thumbnail.startsWith("http") ? card.thumbnail : defaultThumbnail

            return (
              <div 
                key={pIdx}
                className="mt-3.5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(99,102,241,0.08)] transition-all duration-300 hover:scale-[1.03] hover:border-indigo-300"
              >
                {/* Visual Image container */}
                <div className="relative h-32 w-full overflow-hidden bg-slate-100">
                  <img 
                    src={finalThumbnail} 
                    alt={card.serviceName} 
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" 
                  />
                  <div className="absolute top-2.5 right-2.5 rounded-lg bg-slate-900/85 px-2 py-0.5 text-[10px] font-black text-amber-400 flex items-center gap-0.5 shadow-sm">
                    ⭐ {card.rating}
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-3.5 space-y-2.5 text-left bg-white">
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-800 tracking-wide truncate">{card.serviceName}</h5>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5 truncate">📷 Studio: {card.name}</p>
                  </div>
                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500">Giá tham khảo:</span>
                      <span className="text-[11px] font-extrabold text-pink-600">{card.priceRange}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          navigate(`/photographers/${card.studioId}`)
                          setIsOpen(false)
                        }}
                        className="flex-1 rounded-lg border border-indigo-200 hover:border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 px-2 py-1.5 text-[9px] font-bold text-indigo-700 text-center transition-all active:scale-95"
                      >
                        Hồ Sơ Studio 🏢
                      </button>
                      {card.serviceId && (
                        <button
                          onClick={() => {
                            navigate(`/photosets/${card.serviceId}`)
                            setIsOpen(false)
                          }}
                          className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-2 py-1.5 text-[9px] font-bold text-white text-center transition-all shadow-sm active:scale-95 hover:shadow-[0_4px_10px_rgba(79,70,229,0.25)]"
                        >
                          Xem Dịch Vụ 📸
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          }
        })}
      </div>
    )
  }

  return (
    <>
      {/* ── Nút kích hoạt Chatbot nổi ở góc màn hình ────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3" style={{ zIndex: 9999 }}>
        {/* Tooltip chào mừng */}
        <AnimatePresence>
          {showTooltip && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="mr-3 max-w-[220px] rounded-2xl border border-slate-200 bg-white p-3.5 text-xs text-slate-700 shadow-[0_8px_30px_rgba(99,102,241,0.12)] backdrop-blur-xl"
            >
              <div className="font-bold text-indigo-600 flex items-center gap-1.5 mb-1 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-spin" /> Trợ lý GO! AI
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Dạ, em có thể giúp anh/chị tìm thợ chụp hoặc tư vấn đặt lịch ạ! 📸
              </p>
              <button 
                onClick={() => setShowTooltip(false)}
                className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600 transition"
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
          whileHover={{ scale: 1.08, rotate: 2 }}
          whileTap={{ scale: 0.95 }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-[0_8px_30px_rgba(79,70,229,0.35)] border border-white/20 overflow-hidden"
        >
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
                <Sparkles className="h-6 w-6 animate-pulse" />
                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 rounded-full bg-emerald-500 border-2 border-indigo-600 shadow-[0_0_6px_#10b981]" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ── Cửa sổ Chat Trợ lý ảo (Chat Drawer) ────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.92 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-24 right-6 flex h-[580px] w-[380px] flex-col overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/95 backdrop-blur-2xl text-slate-800 shadow-[0_20px_50px_rgba(99,102,241,0.15)]"
            style={{ zIndex: 9999 }}
          >
            {/* Lớp nền khuếch tán ánh sáng dịu mắt */}
            <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-indigo-100/50 blur-[60px] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-pink-100/40 blur-[60px] pointer-events-none" />

            {/* Header - Thiết kế mới đồng bộ tông sáng premium */}
            <div className="relative flex items-center justify-between bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white border border-white/20 shadow-sm">
                  <Bot className="h-5.5 w-5.5 animate-pulse" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-indigo-600 shadow-[0_0_4px_#34d399]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm tracking-wide">GO! Assistant</h4>
                  <p className="text-[10px] text-indigo-200 font-medium">Trợ lý hỗ trợ đặt lịch 24/7</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition duration-200"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Danh sách tin nhắn - Readability & Contrast optimized */}
            <div ref={chatContainerRef} className="relative flex-1 min-h-0 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent bg-slate-50/50 z-0">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-2.5 items-end ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm">
                      <Bot className="h-4 w-4 text-indigo-500" />
                    </div>
                  )}

                  <div
                    className={`max-w-[78%] rounded-[1.2rem] py-3 px-4 shadow-sm transition-all duration-200 ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-tr-none font-medium'
                        : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-none shadow-[0_2px_8px_rgba(0,0,0,0.02)]'
                    }`}
                  >
                    {renderMessageContent(msg.content)}
                  </div>

                  {/* Removed User avatar to prevent bubble crowding */}
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex gap-2.5 items-end justify-start">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm">
                    <Bot className="h-4 w-4 text-indigo-500 animate-spin" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-[1.2rem] bg-white border border-slate-200/80 p-3 rounded-tl-none shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce" />
                  </div>
                </div>
              )}
              <div className="h-px w-full" />
            </div>

            {/* Input Bar - FIXED CUT-OFF & REMOVED DOUBLE BORDER */}
            <div className="relative p-4 border-t border-slate-100 bg-white z-10">
              <div className="relative flex items-center rounded-full border border-slate-200 bg-slate-50/70 p-1.5 pr-12 focus-within:border-indigo-500 focus-within:shadow-[0_0_12px_rgba(99,102,241,0.08)] transition-all duration-300">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Hỏi GO! Assistant về thợ ảnh Đà Nẵng..."
                  className="w-full bg-transparent py-1.5 pl-4 text-slate-800 placeholder-slate-400 border-none outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 text-sm leading-normal"
                  style={{ outline: 'none', boxShadow: 'none', border: 'none' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
                  title="Gửi tin nhắn (Enter)"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-2.5 flex items-center justify-between px-2 text-[9px] text-slate-400 font-medium">
                <span>GO! Assistant • Hỗ trợ trực tuyến</span>
                <span className="flex items-center gap-0.5">
                  Nhấn <CornerDownLeft className="h-2 w-2" /> để gửi
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
