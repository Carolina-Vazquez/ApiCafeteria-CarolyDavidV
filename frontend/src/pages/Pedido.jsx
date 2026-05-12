import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

function Pedido() {
  const navigate = useNavigate()
  const [carrito, setCarrito] = useState(JSON.parse(localStorage.getItem('carrito') || '[]'))
  const [franjaSeleccionada, setFranjaSeleccionada] = useState(null)
  const [franjas, setFranjas] = useState([])
  const [pedidoManana, setPedidoManana] = useState(false)
  const [comentario, setComentario] = useState('')
  const cargado = useRef(false)

  useEffect(() => {
    if (cargado.current) return
    cargado.current = true

    const ahora = new Date()
    const totalMinutos = ahora.getHours() * 60 + ahora.getMinutes()

    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/api/config/`).then(r => r.json()),
      fetch(`${import.meta.env.VITE_API_URL}/api/franjas/`).then(r => r.json())
    ])
      .then(([config, franjas]) => {
        const toMinutos = (hora) => {
          const [h, m] = hora.slice(0, 5).split(':').map(Number)
          return h * 60 + m
        }

        const cierre = toMinutos(config.hora_cierre)
        const corte = toMinutos(config.hora_corte_turno1)
        const finRecreo = toMinutos(config.hora_fin_recreo)

        let franjasFiltradas

        if (totalMinutos >= cierre) {
          setPedidoManana(true)
          franjasFiltradas = franjas
        } else if (totalMinutos >= corte) {
          franjasFiltradas = franjas.filter(f => toMinutos(f.hora_inicio) >= finRecreo)
        } else {
          franjasFiltradas = franjas.filter(f => toMinutos(f.hora_inicio) >= totalMinutos)
        }

        setFranjas(franjasFiltradas)
      })
      .catch(() => {
        const todasFranjas = [
          { id: 1, hora_inicio: '08:45', hora_fin: '09:00' },
          { id: 2, hora_inicio: '09:00', hora_fin: '09:15' },
          { id: 3, hora_inicio: '09:15', hora_fin: '09:30' },
          { id: 4, hora_inicio: '09:30', hora_fin: '09:45' },
          { id: 5, hora_inicio: '09:45', hora_fin: '10:00' },
          { id: 6, hora_inicio: '10:00', hora_fin: '10:15' },
          { id: 7, hora_inicio: '10:15', hora_fin: '10:30' },
          { id: 8, hora_inicio: '10:30', hora_fin: '10:45' },
          { id: 9, hora_inicio: '10:45', hora_fin: '11:00' },
          { id: 10, hora_inicio: '11:00', hora_fin: '11:15' },
          { id: 11, hora_inicio: '11:15', hora_fin: '11:30' },
          { id: 12, hora_inicio: '11:30', hora_fin: '11:45' },
          { id: 13, hora_inicio: '12:00', hora_fin: '12:15' },
          { id: 14, hora_inicio: '12:15', hora_fin: '12:30' },
          { id: 15, hora_inicio: '12:30', hora_fin: '12:45' },
          { id: 16, hora_inicio: '12:45', hora_fin: '13:00' },
          { id: 17, hora_inicio: '13:00', hora_fin: '13:15' },
          { id: 18, hora_inicio: '13:15', hora_fin: '13:30' },
          { id: 19, hora_inicio: '13:30', hora_fin: '13:45' },
          { id: 20, hora_inicio: '13:45', hora_fin: '14:00' },
          { id: 21, hora_inicio: '14:00', hora_fin: '14:15' },
          { id: 22, hora_inicio: '14:15', hora_fin: '14:30' },
        ]
        setFranjas(todasFranjas)
      })
  }, [])

  const actualizarCarrito = (nuevoCarrito) => {
    setCarrito(nuevoCarrito)
    localStorage.setItem('carrito', JSON.stringify(nuevoCarrito))
  }

  const aumentarCantidad = (id) => {
    actualizarCarrito(carrito.map(p =>
      p.id === id ? { ...p, cantidad: p.cantidad + 1 } : p
    ))
  }

  const reducirCantidad = (id) => {
    const item = carrito.find(p => p.id === id)
    if (item.cantidad === 1) {
      eliminarProducto(id)
    } else {
      actualizarCarrito(carrito.map(p =>
        p.id === id ? { ...p, cantidad: p.cantidad - 1 } : p
      ))
    }
  }

  const eliminarProducto = (id) => {
    actualizarCarrito(carrito.filter(p => p.id !== id))
  }

  const total = carrito.reduce((acc, p) => acc + Number(p.precio) * p.cantidad, 0)

  const handleConfirmar = () => {
    if (!franjaSeleccionada || carrito.length === 0) return
    localStorage.setItem('pedido', JSON.stringify({
      carrito,
      franja: franjas.find(f => f.id === franjaSeleccionada),
      total,
      comentario,
      fecha: new Date().toISOString()
    }))
    navigate('/pago')
  }

  if (carrito.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--crema)' }}>
        <div style={{ background: 'var(--verde-oscuro)', padding: '16px 16px 24px' }}>
          <button
            onClick={() => navigate('/menu')}
            style={{ background: 'none', border: 'none', color: 'rgba(245,240,232,0.8)', fontSize: 20, cursor: 'pointer', marginBottom: 8, display: 'block' }}
          >←</button>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ fontSize: 48 }}>🛍️</div>
          <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--gris-texto)' }}>Tu carrito está vacío</div>
          <button
            onClick={() => navigate('/menu')}
            style={{ background: 'var(--verde-oscuro)', color: 'white', border: 'none', borderRadius: 50, padding: '12px 24px', fontSize: 14, cursor: 'pointer', marginTop: 8 }}
          >Volver al menú</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--crema)' }}>

      <div style={{ background: 'var(--verde-oscuro)', padding: '16px 16px 24px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: 'rgba(245,240,232,0.8)', fontSize: 20, cursor: 'pointer', marginBottom: 8, display: 'block' }}
        >←</button>
        <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--crema)' }}>Tu pedido</div>
        <div style={{ fontSize: 13, color: 'rgba(245,240,232,0.7)', marginTop: 2 }}>Elige la hora de recogida</div>
      </div>

      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: '100px' }}>

        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--gris-texto)', marginBottom: 10 }}>
            Artículos seleccionados
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {carrito.map(item => (
              <div key={item.id} style={{
                background: 'white', borderRadius: 12,
                padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 10
              }}>
                <div style={{ fontSize: 24 }}>{item.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#2a2a28' }}>{item.nombre}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontSize: 12, color: '#999' }}>{Number(item.precio).toFixed(2)}€ ud.</div>
                    {item.cantidad > 1 && (
                      <div style={{ fontSize: 12, color: 'var(--verde-oscuro)', fontWeight: 600 }}>
                        · {(Number(item.precio) * item.cantidad).toFixed(2)}€
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => reducirCantidad(item.id)}
                    style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid #ddd', background: 'white', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1a18' }}>−</button>
                  <span style={{ fontSize: 13, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>
                    {String(item.cantidad).padStart(2, '0')}
                  </span>
                  <button onClick={() => aumentarCantidad(item.id)}
                    style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'var(--verde-oscuro)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>+</button>
                </div>
                <button onClick={() => eliminarProducto(item.id)}
                  style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#ff5252', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑️</button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--gris-texto)', marginBottom: 10 }}>
            Franja de recogida
          </div>
          {pedidoManana && (
            <div style={{ background: '#fff8e1', border: '1.5px solid #ffe082', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>📅</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#f57c00' }}>Pedido para mañana</div>
                <div style={{ fontSize: 12, color: '#f57c00', opacity: 0.8 }}>Selecciona la franja de recogida para mañana</div>
              </div>
            </div>
          )}
          {franjas.length === 0 ? (
            <div style={{ fontSize: 13, color: '#888', textAlign: 'center', padding: 16 }}>
              Cargando franjas horarias...
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {franjas.map(franja => (
                <button
                  key={franja.id}
                  onClick={() => setFranjaSeleccionada(franja.id)}
                  style={{
                    borderRadius: 12, padding: '12px 10px',
                    textAlign: 'center', fontSize: 13, fontWeight: 500,
                    cursor: 'pointer',
                    border: franjaSeleccionada === franja.id ? 'none' : '1.5px solid #ddd',
                    background: franjaSeleccionada === franja.id ? 'var(--verde-oscuro)' : 'white',
                    color: franjaSeleccionada === franja.id ? 'var(--crema)' : 'var(--gris-texto)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {franja.hora_inicio.slice(0, 5)} – {franja.hora_fin.slice(0, 5)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--gris-texto)', marginBottom: 10 }}>
            Comentarios (opcional)
          </div>
          <textarea
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            placeholder="¿Algún comentario sobre tu pedido?"
            maxLength={200}
            style={{
              width: '100%', background: 'white',
              border: '1.5px solid #ddd', borderRadius: 12,
              padding: '12px 14px', fontSize: 13,
              color: 'var(--gris-texto)', resize: 'none',
              height: 80, fontFamily: 'Inter, sans-serif',
              outline: 'none'
            }}
          />
        </div>

        <div style={{
          background: 'white', borderRadius: 12,
          padding: '12px 14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span style={{ fontSize: 13, color: '#666' }}>Total a pagar</span>
          <span style={{ fontSize: 22, fontWeight: 500, color: 'var(--verde-oscuro)' }}>
            {total.toFixed(2)}€
          </span>
        </div>
      </div>

      <div style={{
        position: 'fixed', bottom: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        padding: '12px 16px 36px',
        background: 'white', borderTop: '1px solid #f0ede8'
      }}>
        <button
          onClick={handleConfirmar}
          disabled={!franjaSeleccionada}
          style={{
            width: '100%',
            background: franjaSeleccionada ? '#4CAF82' : '#ccc',
            color: 'white', border: 'none',
            borderRadius: 50, padding: '15px',
            fontSize: 15, fontWeight: 500,
            cursor: franjaSeleccionada ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s ease'
          }}
        >
          Pagar y confirmar pedido
        </button>
      </div>

    </div>
  )
}

export default Pedido