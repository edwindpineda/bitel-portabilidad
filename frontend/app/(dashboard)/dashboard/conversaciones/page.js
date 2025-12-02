'use client';

import { useState } from 'react';

export default function ConversacionesPage() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock data - conversaciones
  const conversations = [
    {
      id: 1,
      clientName: 'Carlos Pérez',
      lastMessage: 'Quiero portarme a Bitel, tengo Movistar',
      timestamp: '5 min',
      unread: 2,
      status: 'nuevo',
      phone: '+51 987 654 321',
      operator: 'Movistar',
    },
    {
      id: 2,
      clientName: 'María López',
      lastMessage: 'Me interesa el plan de 45 soles',
      timestamp: '15 min',
      unread: 1,
      status: 'interesado',
      phone: '+51 987 654 322',
      operator: 'Claro',
    },
    {
      id: 3,
      clientName: 'Juan Torres',
      lastMessage: 'Perfecto, procedo con la portabilidad',
      timestamp: '1 hora',
      unread: 0,
      status: 'ganado',
      phone: '+51 987 654 323',
      operator: 'Entel',
    },
    {
      id: 4,
      clientName: 'Ana Gutiérrez',
      lastMessage: 'Cuánto cuesta portarme?',
      timestamp: '2 horas',
      unread: 1,
      status: 'nuevo',
      phone: '+51 987 654 324',
      operator: 'Movistar',
    },
    {
      id: 5,
      clientName: 'Pedro Ramírez',
      lastMessage: 'Necesito más información sobre los planes',
      timestamp: '3 horas',
      unread: 0,
      status: 'contactado',
      phone: '+51 987 654 325',
      operator: 'Claro',
    },
  ];

  // Mock data - mensajes del chat seleccionado
  const mockMessages = {
    1: [
      { id: 1, type: 'client', text: 'Hola, buenos días', timestamp: '10:30 AM' },
      { id: 2, type: 'ai', text: '¡Hola! Bienvenido a Bitel. ¿En qué puedo ayudarte hoy?', timestamp: '10:30 AM' },
      { id: 3, type: 'client', text: 'Quiero portarme a Bitel, tengo Movistar', timestamp: '10:31 AM' },
      { id: 4, type: 'ai', text: '¡Excelente decisión! La portabilidad es rápida y sin costo. ¿De qué operador vienes?', timestamp: '10:31 AM' },
      { id: 5, type: 'client', text: 'De Movistar', timestamp: '10:32 AM' },
      { id: 6, type: 'ai', text: 'Perfecto. Tenemos planes desde S/45 mensuales con muchos beneficios. Un asesor se pondrá en contacto contigo en breve.', timestamp: '10:32 AM' },
    ],
    2: [
      { id: 1, type: 'client', text: 'Hola, quisiera información', timestamp: '9:15 AM' },
      { id: 2, type: 'ai', text: 'Hola, con gusto te ayudo. ¿Qué información necesitas?', timestamp: '9:15 AM' },
      { id: 3, type: 'client', text: 'Me interesa el plan de 45 soles', timestamp: '9:16 AM' },
      { id: 4, type: 'vendor', text: 'Hola María! El plan de S/45 incluye 50GB + redes sociales ilimitadas. ¿Te gustaría proceder con la portabilidad?', timestamp: '9:20 AM' },
    ],
  };

  const statusConfig = {
    nuevo: { label: 'Nuevo', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
    contactado: { label: 'Contactado', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
    interesado: { label: 'Interesado', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
    ganado: { label: 'Ganado', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
    perdido: { label: 'Perdido', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  };

  const filteredConversations = filterStatus === 'all'
    ? conversations
    : conversations.filter(c => c.status === filterStatus);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    // Aquí iría la lógica para enviar el mensaje al backend
    console.log('Enviando mensaje:', messageText);
    setMessageText('');
  };

  const handleDeriveToBackoffice = () => {
    // Lógica para derivar a backoffice
    console.log('Derivando conversación a backoffice');
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Conversaciones</h1>
        <p className="text-gray-600 mt-1">Gestiona tus conversaciones con clientes</p>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100%-5rem)] flex">
        {/* Left Panel - Lista de Conversaciones */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          {/* Filtros */}
          <div className="p-4 border-b border-gray-200">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="all">Todas las conversaciones</option>
              <option value="nuevo">Nuevas</option>
              <option value="contactado">Contactadas</option>
              <option value="interesado">Interesados</option>
              <option value="ganado">Ganadas</option>
            </select>
          </div>

          {/* Lista de Conversaciones */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedChat(conv)}
                className={`p-4 border-b border-gray-200 cursor-pointer transition-colors ${
                  selectedChat?.id === conv.id
                    ? 'bg-primary-50 border-l-4 border-l-primary-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {conv.clientName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{conv.clientName}</h3>
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig[conv.status].color}`}>
                        {statusConfig[conv.status].label}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{conv.timestamp}</span>
                </div>
                <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                {conv.unread > 0 && (
                  <div className="mt-2">
                    <span className="inline-block px-2 py-0.5 bg-danger-500 text-white text-xs font-semibold rounded-full">
                      {conv.unread} nuevo{conv.unread > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Conversación Activa */}
        {selectedChat ? (
          <div className="flex-1 flex flex-col">
            {/* Header del Chat */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {selectedChat.clientName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedChat.clientName}</h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>{selectedChat.phone}</span>
                    <span>•</span>
                    <span>Operador: {selectedChat.operator}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="nuevo">Nuevo</option>
                  <option value="contactado">Contactado</option>
                  <option value="interesado">Interesado</option>
                  <option value="ganado">Ganado</option>
                  <option value="perdido">Perdido</option>
                </select>
                <button
                  onClick={handleDeriveToBackoffice}
                  className="px-4 py-1.5 bg-warning-500 text-white rounded-lg hover:bg-warning-600 text-sm font-medium"
                >
                  Derivar a BO
                </button>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {(mockMessages[selectedChat.id] || []).map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'vendor' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-md ${message.type === 'vendor' ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.type === 'ai'
                          ? 'bg-purple-100 text-purple-900'
                          : message.type === 'vendor'
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      {message.type === 'ai' && (
                        <div className="flex items-center space-x-1 mb-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                          </svg>
                          <span className="text-xs font-semibold">AI Bot</span>
                        </div>
                      )}
                      <p className="text-sm">{message.text}</p>
                      <span className={`text-xs mt-1 block ${message.type === 'vendor' ? 'text-primary-100' : 'text-gray-500'}`}>
                        {message.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input de Mensaje */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-end space-x-2">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  rows="3"
                />
                <button
                  onClick={handleSendMessage}
                  className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors h-[76px]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Selecciona una conversación</h3>
              <p className="text-gray-600">Elige una conversación de la lista para comenzar a chatear</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
