import { useNavigate } from 'react-router-dom'

function Confirmacion() {
  const navigate = useNavigate()
  const pedido = JSON.parse(localStorage.getItem('pedido') || '{}')
  const carrito = pedido.carrito || []
  const franja = pedido.franja
  const total = pedido.total || 0

  const codigo = pedido.codigo || 'PENDIENTE'

  if (!franja) {
    navigate('/menu')
    return null
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--crema)' }}>

      <div style={{
        background: 'var(--verde-oscuro)',
        padding: '48px 20px 40px',
        textAlign: 'center', color: 'var(--crema)'
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px', fontSize: 26
        }}>✓</div>
        <div style={{ fontSize: 22, fontWeight: 500 }}>¡Pedido confirmado!</div>
        <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
          Muestra este código en caja
        </div>
      </div>

      <div style={{
        background: 'white', borderRadius: 20,
        margin: '-18px 16px 0',
        padding: '24px 20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.07)'
      }}>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            fontSize: 11, color: '#888',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            marginBottom: 8
          }}>
            Código de pedido
          </div>
          <div style={{
            fontSize: 48, fontWeight: 700,
            color: 'var(--verde-oscuro)',
            letterSpacing: 8
          }}>
            {codigo}
          </div>
        </div>

        <div style={{
          background: 'var(--verde-claro)',
          borderRadius: 50, padding: '8px 16px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 6,
          marginBottom: 20
        }}>
          <span>⏰</span>
          <span style={{ fontSize: 13, color: 'var(--verde-oscuro)', fontWeight: 500 }}>
            Recogida: {franja.hora_inicio?.slice(0, 5)} – {franja.hora_fin?.slice(0, 5)}
          </span>
        </div>

        <div style={{
          fontSize: 11, color: '#888',
          letterSpacing: '0.06em', textTransform: 'uppercase',
          marginBottom: 10
        }}>
          Productos del pedido
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {carrito.map(item => (
            <div key={item.id} style={{
              flex: '1 1 calc(33% - 8px)', minWidth: 80,
              borderRadius: 14, background: 'var(--crema)',
              border: '1.5px solid #e8e3da',
              padding: '10px 6px 8px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 4
            }}>
              <div style={{ fontSize: 28 }}>{item.emoji}</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#2a2a28', textAlign: 'center', lineHeight: 1.3 }}>
                {item.nombre}
              </div>
              <div style={{ fontSize: 11, color: 'var(--verde-oscuro)' }}>
                {Number(item.precio).toFixed(2)}€
              </div>
              <div style={{
                background: 'var(--verde-oscuro)', color: 'white',
                fontSize: 10, fontWeight: 500,
                borderRadius: 50, padding: '2px 8px'
              }}>
                x{item.cantidad}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', borderTop: '1.5px solid #f0ede8',
          paddingTop: 12
        }}>
          <span style={{ fontSize: 13, color: '#444' }}>Total pagado</span>
          <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--verde-oscuro)' }}>
            {Number(total).toFixed(2)}€
          </span>
        </div>
      </div>

      <div style={{ padding: '20px 16px', marginTop: 'auto' }}>
        <button
          onClick={() => navigate('/inicio')}
          style={{
            width: '100%', background: '#4CAF82',
            color: 'white', border: 'none',
            borderRadius: 50, padding: '15px',
            fontSize: 15, fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          Volver al inicio
        </button>
      </div>

    </div>
  )
}

export default Confirmacion