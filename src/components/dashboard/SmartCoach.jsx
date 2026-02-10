import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { askGemini } from '../../services/ai';

export const SmartCoach = ({ metrics, activities }) => {
  // Estado del chat
  const [messages, setMessages] = useState([
    { role: 'ai', text: "¡Hola! Soy tu Coach IA. He analizado tus datos. ¿En qué puedo ayudarte hoy? 🤖" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll al final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages, isTyping]);

  // ENVIAR MENSAJE
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setInput(''); // Limpiar input
    
    // 1. Añadir mensaje usuario
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    // 2. Preparar contexto (Datos reales)
    const context = {
        currentMetrics: metrics,
        recentActivities: activities || [],
        nextRace: null // Aquí podrías pasarle el evento A si lo tuviéramos en props
    };

    // 3. Llamar a la IA
    try {
        const aiResponse = await askGemini(userMsg, context);
        setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    } catch (error) {
        setMessages(prev => [...prev, { role: 'ai', text: "Error de conexión. ¿Tienes la API Key bien puesta?" }]);
    } finally {
        setIsTyping(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-[500px] transition-colors duration-300 relative overflow-hidden">
      
      {/* HEADER */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur absolute top-0 w-full z-10 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Sparkles size={18} />
            </div>
            <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Coach Gemini</h3>
                <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Online
                </p>
            </div>
        </div>
        <button 
            onClick={() => setMessages([{ role: 'ai', text: "Chat reiniciado. ¿Qué tal el entreno?" }])}
            className="text-slate-400 hover:text-red-500 transition" 
            title="Borrar chat"
        >
            <Trash2 size={16}/>
        </button>
      </div>

      {/* ÁREA DE MENSAJES */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-20 pb-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
        {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 shrink-0 mt-1">
                        <Bot size={16} />
                    </div>
                )}
                
                <div 
                    className={`max-w-[80%] p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm whitespace-pre-wrap
                    ${msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-none border border-slate-100 dark:border-slate-700'
                    }`}
                >
                    {msg.text}
                </div>

                {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 shrink-0 mt-1">
                        <User size={16} />
                    </div>
                )}
            </div>
        ))}

        {isTyping && (
            <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 shrink-0">
                    <Loader2 size={16} className="animate-spin" />
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-slate-100 dark:border-slate-700 flex gap-1 items-center h-10">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2">
        <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta sobre tu rendimiento..."
            className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 ring-blue-500 outline-none transition-all placeholder:text-slate-400"
        />
        <button 
            type="submit" 
            disabled={!input.trim() || isTyping}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-all shadow-lg shadow-blue-900/20"
        >
            <Send size={18} />
        </button>
      </form>

    </div>
  );
};