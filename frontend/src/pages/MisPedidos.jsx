import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function MisPedidos() {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token || token === 'token-prueba') {
      // Sin token real usamos localStorage
      const pedidoActual = JSON.parse(localStorage.getItem('pedido') || 'null')
      if (pedidoActual) setPedidos([pedidoActual])
      setCargando(false)
      return
    }

    fetch(`${import.meta.env.VITE_API_URL}/api/orders/me/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPedidos(data)
        else {
          const pedidoActual = JSON.parse(localStorage.getItem('pedido') || 'null')
          if (pedidoActual) setPedidos([pedidoActual])
        }
        setCargando(false)
      })
      .catch(() => {
        const pedidoActual = JSON.parse(localStorage.getItem('pedido') || 'null')
        if (pedidoActual) setPedidos([pedidoActual])
        setCargando(false)
      })
  }, [])

  const getColorEstado = (estado) => {
    switch (estado) {
      case 'PENDIENTE_PAGO': return { bg: '#fff8e1', color: '#f57c00' }
      case 'PAGADO': return { bg: '#e3f2fd', color: '#1565c0' }
      case 'PREPARANDO': return { bg: '#fff3e0', color: '#e65100' }
      case 'LISTO': return { bg: '#e8f5e9', color: '#2e7d32' }
      case 'ENTREGADO': return { bg: '#f5f5f5', color: '#616161' }
      default: return { bg: '#f5f5f5', color: '#616161' }
    }
  }

  const getLabelEstado = (estado) => {
    switch (estado) {
      case 'PENDIENTE_PAGO': return 'Pendiente de pago'
      case 'PAGADO': return 'Pagado'
      case 'PREPARANDO': return '🍳 Preparando'
      case 'LISTO': return '✅ Listo para recoger'
      case 'ENTREGADO': return '📦 Entregado'
      default: return 'Pendiente'
    }
  }

  const formatFecha = (fecha) => {
    if (!fecha) return ''
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--crema)' }}>

      {/* HEADER */}
      <div style={{ background: 'var(--verde-oscuro)', padding: '16px 16px 24px' }}>
        <button onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: 'rgba(245,240,232,0.8)', fontSize: 20, cursor: 'pointer', marginBottom: 12, display: 'block' }}>←</button>
        <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--crema)' }}>Mis pedidos</div>
        <div style={{ fontSize: 13, color: 'rgba(245,240,232,0.7)', marginTop: 2 }}>Historial de pedidos</div>
      </div>

      {/* CONTENIDO */}
      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {cargando ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#888', fontSize: 14 }}>
            Cargando pedidos...
          </div>
        ) : pedidos.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 }}>
            <div style={{ fontSize: 48 }}>🛍️</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--gris-texto)' }}>No tienes pedidos aún</div>
            <button onClick={() => navigate('/menu')}
              style={{ background: 'var(--verde-oscuro)', color: 'white', border: 'none', borderRadius: 50, padding: '12px 24px', fontSize: 14, cursor: 'pointer', marginTop: 8 }}>
              Hacer un pedido
            </button>
          </div>
        ) : (
          pedidos.map((pedido, index) => {
            const estado = pedido.estado || 'PENDIENTE_PAGO'
            const colorEstado = getColorEstado(estado)
            const lineas = pedido.lineas || pedido.carrito || []
            return (
              <div key={pedido.id || index} style={{ background: 'white', borderRadius: 16, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Cabecera */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                      Código de pedido
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--verde-oscuro)', letterSpacing: 4 }}>
                      {pedido.codigo || 'A7K2MN'}
                    </div>
                  </div>
                  <div style={{ background: colorEstado.bg, color: colorEstado.color, borderRadius: 50, padding: '4px 12px', fontSize: 11, fontWeight: 500 }}>
                    {getLabelEstado(estado)}
                  </div>
                </div>

                {/* Fecha */}
                {(pedido.creado_en || pedido.fecha) && (
                  <div style={{ fontSize: 12, color: '#888' }}>
                    {formatFecha(pedido.creado_en || pedido.fecha)}
                  </div>
                )}

                {/* Franja horaria */}
                {pedido.franja && (
                  <div style={{ background: 'var(--verde-claro)', borderRadius: 50, padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
                    <span>⏰</span>
                    <span style={{ fontSize: 12, color: 'var(--verde-oscuro)', fontWeight: 500 }}>
                      {pedido.franja.hora_inicio?.slice(0, 5)} – {pedido.franja.hora_fin?.slice(0, 5)}
                    </span>
                  </div>
                )}

                {/* Productos */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {lineas.map((linea, i) => {
                    const nombre = linea.producto?.nombre || linea.nombre
                    const emoji = linea.producto?.emoji || linea.emoji
                    const cantidad = linea.cantidad
                    return (
                      <div key={i} style={{ background: 'var(--crema)', borderRadius: 10, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 16 }}>{emoji}</span>
                        <span style={{ fontSize: 12, color: '#2a2a28' }}>{nombre}</span>
                        <span style={{ fontSize: 11, color: '#888' }}>x{cantidad}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0ede8', paddingTop: 10 }}>
                  <span style={{ fontSize: 12, color: '#888' }}>Total</span>
                  <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--verde-oscuro)' }}>
                    {Number(pedido.total).toFixed(2)}€
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default MisPedidos