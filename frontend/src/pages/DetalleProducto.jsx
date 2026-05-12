import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'

function DetalleProducto() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const [producto, setProducto] = useState(location.state?.producto || null)
  const [cargando, setCargando] = useState(true)
  const [cantidad, setCantidad] = useState(1)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}/`)
      .then(res => res.json())
      .then(data => {
        setProducto(data)
        setCargando(false)
      })
      .catch(() => {
        // Si falla usamos el producto del state
        if (location.state?.producto) {
          setProducto(location.state.producto)
        }
        setCargando(false)
      })
  }, [id])

  const añadirAlCarrito = () => {
    const carritoActual = JSON.parse(localStorage.getItem('carrito') || '[]')
    const existe = carritoActual.find(p => p.id === producto.id)
    let nuevoCarrito
    if (existe) {
      nuevoCarrito = carritoActual.map(p =>
        p.id === producto.id ? { ...p, cantidad: p.cantidad + cantidad } : p
      )
    } else {
      nuevoCarrito = [...carritoActual, { ...producto, cantidad }]
    }
    localStorage.setItem('carrito', JSON.stringify(nuevoCarrito))
    navigate(-1)
  }

  const colorFondo = (cat) => {
    if (cat === 'Ensaladas') return '#edf5f0'
    if (cat === 'Bocatas') return '#fef6e8'
    if (cat === 'Bebidas') return '#f0edf8'
    return '#fceef0'
  }

  if (cargando) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--crema)' }}>
        <div style={{ fontSize: 14, color: '#888' }}>Cargando producto...</div>
      </div>
    )
  }

  if (!producto) {
    navigate('/menu')
    return null
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'white' }}>

      {/* IMAGEN SUPERIOR */}
      <div style={{
        position: 'relative',
        height: '45vh',
        background: colorFondo(producto.categoria?.nombre),
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', top: 8, left: 20,
            background: 'white', border: 'none',
            borderRadius: '50%', width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 18,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >←</button>

        {producto.imagen ? (
          <img
            src={producto.imagen.startsWith('http') ? producto.imagen : `${import.meta.env.VITE_API_URL}${producto.imagen}`}
            alt={producto.nombre}
            style={{ width: '70%', objectFit: 'contain' }}
          />
        ) : (
          <div style={{ fontSize: 100 }}>{producto.emoji}</div>
        )}
      </div>

      {/* CONTENIDO */}
      <div style={{
        flex: 1, padding: '24px 20px',
        display: 'flex', flexDirection: 'column', gap: 12
      }}>
        <div>
          <div style={{
            fontSize: 22, fontWeight: 700,
            color: '#1a1a18', textTransform: 'uppercase',
            letterSpacing: -0.5, lineHeight: 1.2
          }}>
            {producto.nombre}
          </div>
          <div style={{
            fontSize: 18, fontWeight: 600,
            color: '#1a1a18', marginTop: 6
          }}>
            {Number(producto.precio).toFixed(2)}€
          </div>
        </div>

        {/* Descripción */}
        {producto.descripcion && (
          <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>
            {producto.descripcion}
          </div>
        )}

        {/* Alérgenos */}
        {producto.alergenos && producto.alergenos.length > 0 && (
          <div style={{ paddingTop: 12, borderTop: '1px solid #f0ede8' }}>
            <div style={{ fontSize: 13, color: '#999', lineHeight: 1.6 }}>
              <span style={{ fontWeight: 500 }}>Alérgenos: </span>
              {producto.alergenos.map(a => a.nombre_display).join(' · ')}
            </div>
          </div>
        )}
      </div>

      {/* TOTAL Y BOTÓN */}
      <div style={{
        borderTop: '1px solid #f0ede8',
        padding: '16px 20px 36px',
        background: 'white'
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 16
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a18' }}>TOTAL</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a18' }}>
              {(Number(producto.precio) * cantidad).toFixed(2)}€
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setCantidad(c => Math.max(1, c - 1))}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '1.5px solid #ddd', background: 'white',
                fontSize: 18, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#1a1a18'
              }}
            >−</button>
            <div style={{
              width: 40, height: 32, border: '1.5px solid #ddd',
              borderRadius: 8, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#1a1a18'
            }}>
              {String(cantidad).padStart(2, '0')}
            </div>
            <button
              onClick={() => setCantidad(c => c + 1)}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '1.5px solid #ddd', background: 'white',
                fontSize: 18, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#1a1a18'
              }}
            >+</button>
          </div>
        </div>

        <button
          onClick={añadirAlCarrito}
          style={{
            width: '100%', background: '#1a1a18',
            color: 'white', border: 'none',
            borderRadius: 50, padding: '18px 24px',
            fontSize: 15, fontWeight: 600,
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
        >
          <span>+ Añadir al carrito</span>
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 50, padding: '4px 12px', fontSize: 14
          }}>
            {(Number(producto.precio) * cantidad).toFixed(2)}€
          </div>
        </button>
      </div>

    </div>
  )
}

export default DetalleProducto