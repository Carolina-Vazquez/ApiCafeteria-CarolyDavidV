import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

function Notificaciones() {
  const navigate = useNavigate()
  const [notificaciones, setNotificaciones] = useState(() => {
    return JSON.parse(localStorage.getItem('notificaciones') || '[]')
  })
  const [estadoActual, setEstadoActual] = useState(null)
  const intervalRef = useRef(null)

  // Polling — consulta el estado del pedido activo cada 30 segundos
  useEffect(() => {
  const pedido = JSON.parse(localStorage.getItem('pedido') || 'null')
  if (!pedido?.codigo) return

  const token = localStorage.getItem('token')
  if (!token || token === 'token-prueba') return // No hacer polling con token de prueba

  const consultarEstado = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/me/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) return
      const data = await res.json()
      if (!Array.isArray(data)) return

      const pedidoActivo = data.find(p => p.codigo === pedido.codigo)
      if (!pedidoActivo) return

      const estadoAnterior = estadoActual
      setEstadoActual(pedidoActivo.estado)

      if (pedidoActivo.estado === 'LISTO' && estadoAnterior !== 'LISTO') {
        const nuevaNotif = {
          id: Date.now(),
          titulo: '✅ Pedido listo',
          mensaje: `Tu pedido ${pedido.codigo} está listo para recoger`,
          hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          leida: false
        }
        setNotificaciones(prev => {
          const nuevas = [nuevaNotif, ...prev]
          localStorage.setItem('notificaciones', JSON.stringify(nuevas))
          return nuevas
        })
      }

      if (pedidoActivo.estado === 'PREPARANDO' && estadoAnterior !== 'PREPARANDO') {
        const nuevaNotif = {
          id: Date.now(),
          titulo: '🍳 Preparando tu pedido',
          mensaje: `Tu pedido ${pedido.codigo} está siendo preparado`,
          hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          leida: false
        }
        setNotificaciones(prev => {
          const nuevas = [nuevaNotif, ...prev]
          localStorage.setItem('notificaciones', JSON.stringify(nuevas))
          return nuevas
        })
      }
    } catch (err) {
      console.log('Error consultando estado:', err)
    }
  }

  consultarEstado()
  intervalRef.current = setInterval(consultarEstado, 30000)
  return () => clearInterval(intervalRef.current)
}, [estadoActual])

  const marcarLeida = (id) => {
    setNotificaciones(prev => {
      const nuevas = prev.map(n => n.id === id ? { ...n, leida: true } : n)
      localStorage.setItem('notificaciones', JSON.stringify(nuevas))
      return nuevas
    })
  }

  const limpiarTodas = () => {
    setNotificaciones([])
    localStorage.removeItem('notificaciones')
  }

  const noLeidas = notificaciones.filter(n => !n.leida).length

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--crema)' }}>

      {/* HEADER */}
      <div style={{ background: 'var(--verde-oscuro)', padding: '16px 16px 24px' }}>
        <button
          onClick={() => navigate('/inicio')}
          style={{ background: 'none', border: 'none', color: 'rgba(245,240,232,0.8)', fontSize: 20, cursor: 'pointer', marginBottom: 12, display: 'block' }}
        >←</button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--crema)' }}>Notificaciones</div>
            {noLeidas > 0 && (
              <div style={{ fontSize: 13, color: 'rgba(245,240,232,0.7)', marginTop: 2 }}>
                {noLeidas} sin leer
              </div>
            )}
          </div>
          {notificaciones.length > 0 && (
            <button
              onClick={limpiarTodas}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 50, padding: '6px 14px', fontSize: 12, color: 'var(--crema)', cursor: 'pointer' }}
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {notificaciones.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 }}>
            <div style={{ fontSize: 48 }}>🔔</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--gris-texto)' }}>
              No tienes notificaciones
            </div>
            <div style={{ fontSize: 13, color: '#888', textAlign: 'center' }}>
              Te avisaremos cuando tu pedido esté listo para recoger
            </div>
          </div>
        ) : (
          notificaciones.map(notif => (
            <div
              key={notif.id}
              onClick={() => marcarLeida(notif.id)}
              style={{
                background: notif.leida ? 'white' : 'var(--verde-claro)',
                borderRadius: 14, padding: '14px 16px',
                display: 'flex', gap: 12, alignItems: 'flex-start',
                cursor: 'pointer',
                border: notif.leida ? '1.5px solid #f0ede8' : '1.5px solid var(--verde-medio)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: 24, flexShrink: 0 }}>
                {notif.titulo.startsWith('✅') ? '✅' : '🍳'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#2a2a28', marginBottom: 3 }}>
                  {notif.titulo}
                </div>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.4 }}>
                  {notif.mensaje}
                </div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 6 }}>
                  {notif.hora}
                </div>
              </div>
              {!notif.leida && (
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--verde-medio)', flexShrink: 0, marginTop: 4
                }} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Notificaciones