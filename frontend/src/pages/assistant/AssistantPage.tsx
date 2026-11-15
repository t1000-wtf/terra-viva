import { useEffect, useState, useRef, type FormEvent } from 'react'
import {
  Bot,
  Send,
  Building,
  User,
  Sparkles,
  AlertCircle,
  FileText,
  RotateCcw
} from 'lucide-react'
import client from '../../api/client'

interface MessageItem {
  id?: number | string
  role: 'user' | 'assistant'
  message: string
  created_at?: string
  context_sources?: string[]
}

interface PropertyOption {
  id: number
  name: string
  municipality?: string
  state?: string
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [inputText, setInputText] = useState('')
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [sending, setSending] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [properties, setProperties] = useState<PropertyOption[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | undefined>(undefined)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, sending])

  // Load properties for selector
  useEffect(() => {
    async function loadProperties() {
      try {
        const res = await client.get('/api/v1/properties')
        const data = Array.isArray(res.data) ? res.data : res.data?.items || []
        setProperties(data)
        if (data.length > 0 && !selectedPropertyId) {
          setSelectedPropertyId(data[0].id)
        }
      } catch (err) {
        console.error('Erro ao buscar propriedades:', err)
      }
    }
    loadProperties()
  }, [])

  // Load chat history
  const loadHistory = async (propId?: number) => {
    try {
      setLoadingHistory(true)
      setChatError(null)
      const params = propId ? { property_id: propId } : {}
      const res = await client.get<any[]>('/api/v1/assistant/history', { params })

      if (Array.isArray(res.data)) {
        const mapped: MessageItem[] = res.data.map((item, idx) => ({
          id: item.id || `hist-${idx}`,
          role: item.role === 'user' ? 'user' : 'assistant',
          message: item.message || item.reply || item.content || '',
          created_at: item.created_at || item.timestamp,
          context_sources: item.context_sources,
        }))
        setMessages(mapped)
      } else {
        setMessages([])
      }
    } catch (err: any) {
      console.error('Erro ao carregar histórico:', err)
      setChatError(err.response?.data?.detail || 'Erro ao carregar histórico da conversa.')
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    loadHistory(selectedPropertyId)
  }, [selectedPropertyId])

  const handleSend = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed || sending) return

    const userMsg: MessageItem = {
      id: `usr-${Date.now()}`,
      role: 'user',
      message: trimmed,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputText('')
    setSending(true)
    setChatError(null)

    try {
      const payload: { message: string; property_id?: number } = {
        message: trimmed,
      }
      if (selectedPropertyId) {
        payload.property_id = selectedPropertyId
      }

      const res = await client.post('/api/v1/assistant/chat', payload)
      const data = res.data

      const assistantMsg: MessageItem = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        message: data.reply,
        created_at: data.timestamp || new Date().toISOString(),
        context_sources: data.context_sources,
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: any) {
      console.error('Erro ao enviar mensagem:', err)
      const errorMsg =
        err.response?.data?.detail ||
        'Não foi possível obter resposta do assistente. Verifique a conexão com o servidor.'
      setChatError(errorMsg)
    } finally {
      setSending(false)
    }
  }

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-8.5rem)] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-white shadow-sm">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 flex items-center gap-2">
              Assistente Agronômico TerraViva
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-100/80 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" /> IA Determinística
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Tire dúvidas sobre rotação, manejo de solo, clima da NASA e recomendações
            </p>
          </div>
        </div>

        {/* Property Context Selector */}
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-slate-400" />
          <select
            value={selectedPropertyId || ''}
            onChange={(e) =>
              setSelectedPropertyId(e.target.value ? Number(e.target.value) : undefined)
            }
            className="text-xs bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-green-500"
          >
            <option value="">Sem contexto de propriedade</option>
            {properties.map((prop) => (
              <option key={prop.id} value={prop.id}>
                {prop.name} {prop.municipality ? `(${prop.municipality} - ${prop.state})` : ''}
              </option>
            ))}
          </select>

          <button
            onClick={() => loadHistory(selectedPropertyId)}
            title="Recarregar histórico"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
        {loadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Carregando mensagens anteriores...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center shadow-xs">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">Como posso ajudar sua lavoura hoje?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Pergunte sobre estratégias de rotação para sua propriedade, necessidade hídrica das culturas,
                fixação biológica de nitrogênio ou dados agroclimáticos recentes.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full pt-2">
              {[
                'Quais culturas de cobertura são ideais para rotação com soja?',
                'Como recuperar a matéria orgânica em solos arenosos?',
                'Qual o consumo hídrico estimado para o sorgo granífero?',
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInputText(suggestion)
                  }}
                  className="text-left text-xs text-slate-700 bg-white border border-slate-200 hover:border-green-300 hover:bg-green-50/50 p-2.5 rounded-xl transition shadow-2xs"
                >
                  💡 {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user'

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isUser
                      ? 'bg-green-700 text-white shadow-xs'
                      : 'bg-green-600 text-white shadow-xs ring-2 ring-green-100'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className="flex flex-col space-y-1">
                  <div
                    className={`rounded-2xl p-4 text-sm leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-green-600 text-white rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.message}</div>

                    {/* Context sources chips for assistant */}
                    {!isUser && msg.context_sources && msg.context_sources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
                          <FileText className="w-3 h-3" /> Fontes:
                        </span>
                        {msg.context_sources.map((src, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                          >
                            {src}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span
                    className={`text-[10px] text-slate-400 px-1 ${
                      isUser ? 'text-right' : 'text-left'
                    }`}
                  >
                    {formatTimestamp(msg.created_at)}
                  </span>
                </div>
              </div>
            )
          })
        )}

        {/* Typing indicator */}
        {sending && (
          <div className="flex gap-3 max-w-[85%] mr-auto">
            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs ring-2 ring-green-100">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-xs">
              <div className="flex items-center space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-xs text-slate-400 ml-2 font-medium">Analisando base agronômica...</span>
              </div>
            </div>
          </div>
        )}

        {/* Inline Chat Error */}
        {chatError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 max-w-lg mx-auto">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{chatError}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSend}
        className="p-4 bg-white border-t border-slate-200 flex items-center gap-3"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            selectedPropertyId
              ? 'Faça uma pergunta sobre sua propriedade, clima ou culturas...'
              : 'Faça uma pergunta ao assistente agronômico...'
          }
          disabled={sending}
          className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:bg-white transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="p-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 text-white rounded-xl transition shadow-xs flex-shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  )
}
