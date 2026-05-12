import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const colorFondo = (cat) => {
  if (cat === 'Ensaladas') return '#edf5f0'
  if (cat === 'Bocatas') return '#fef6e8'
  if (cat === 'Bebidas') return '#f0edf8'
  return '#fceef0'
}

function TarjetaProducto({ producto, favoritos, toggleFavorito, setCarrito, navigate }) {
  const [cantidad, setCantidad] = useState(1)

  const handleAnadir = (e) => {
    e.stopPropagation()
    setCarrito(prev => {
      const existe = prev.find(p => p.id === producto.id)
      if (existe) return prev.map(p => p.id === producto.id ? { ...p, cantidad: p.cantidad + cantidad } : p)
      return [...prev, { ...producto, cantidad }]
    })
    setCantidad(1)
  }

  const handleInfo = (e) => {
    e.stopPropagation()
    navigate(`/producto/${producto.id}`, { state: { producto } })
  }

  return (
    <div style={{
      background: 'white', borderRadius: 16,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      position: 'relative'
    }}>
      <button
        onClick={(e) => { e.stopPropagation(); toggleFavorito(producto.id) }}
        style={{
          position: 'absolute', top: 8, right: 8,
          background: 'rgba(255,255,255,0.9)', border: 'none',
          borderRadius: '50%', width: 28, height: 28, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, zIndex: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
        }}
      >
        {favoritos.includes(producto.id) ? '❤️' : '🤍'}
      </button>

      <div style={{
        height: 90,
        background: colorFondo(producto.categoria?.nombre),
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {producto.imagen ? (
          <img src={producto.imagen} alt={producto.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 36 }}>{producto.emoji}</span>
        )}
      </div>

      <div style={{ padding: '8px 10px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#2a2a28', flex: 1 }}>{producto.nombre}</div>
          <button
            onClick={handleInfo}
            style={{
              background: 'none', border: '1.5px solid #ddd', borderRadius: '50%',
              width: 20, height: 20, fontSize: 10, cursor: 'pointer', color: '#999',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginLeft: 4
            }}
          >i</button>
        </div>

        <div style={{ fontSize: 13, color: 'var(--verde-oscuro)', fontWeight: 500, marginBottom: 8 }}>
          {Number(producto.precio).toFixed(2)}€
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setCantidad(c => Math.max(1, c - 1)) }}
            style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px solid #ddd', background: 'white', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1a18' }}
          >−</button>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a18' }}>
            {String(cantidad).padStart(2, '0')}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); setCantidad(c => c + 1) }}
            style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'var(--verde-oscuro)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
          >+</button>
        </div>

        <button
          onClick={handleAnadir}
          style={{ width: '100%', background: '#4CAF82', color: 'white', border: 'none', borderRadius: 50, padding: '7px 0', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        >
          Añadir al carrito
        </button>
      </div>
    </div>
  )
}

function Menu() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [productos, setProductos] = useState([])
  const [cargandoProductos, setCargandoProductos] = useState(true)
  const [categoriaActiva, setCategoriaActiva] = useState('Favoritos')
  const [busqueda, setBusqueda] = useState('')
  const [carrito, setCarrito] = useState(() => {
  const carritoGuardado = localStorage.getItem('carrito')
  return carritoGuardado ? JSON.parse(carritoGuardado) : []
})
  const [favoritos, setFavoritos] = useState(() => {
    const guardados = localStorage.getItem('favoritos')
    return guardados ? JSON.parse(guardados) : []
  })
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [notifNoLeidas, setNotifNoLeidas] = useState(0)
  const seccionesRef = useRef({})
  const categoriasScrollRef = useRef(null)
  const scrollingPorClick = useRef(false)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/products/`)
      .then(res => res.json())
      .then(data => {
        setProductos(data)
        setCargandoProductos(false)
      })
      .catch(() => {
        setProductos([
          { id: 1, nombre: 'Bowl verde', precio: 3.50, emoji: '🥗', categoria: { nombre: 'Ensaladas' }, alergenos: [] },
          { id: 2, nombre: 'Ensalada César', precio: 4.00, emoji: '🥙', categoria: { nombre: 'Ensaladas' }, alergenos: [] },
          { id: 3, nombre: 'Bocata mixto', precio: 2.80, emoji: '🥪', categoria: { nombre: 'Bocatas' }, alergenos: [] },
          { id: 4, nombre: 'Tostada aguacate', precio: 3.00, emoji: '🍞', categoria: { nombre: 'Bocatas' }, alergenos: [] },
          { id: 5, nombre: 'Café con leche', precio: 1.20, emoji: '☕', categoria: { nombre: 'Bebidas' }, alergenos: [] },
          { id: 6, nombre: 'Smoothie fresa', precio: 2.20, emoji: '🍓', categoria: { nombre: 'Bebidas' }, alergenos: [] },
          { id: 7, nombre: 'Zumo naranja', precio: 1.80, emoji: '🍊', categoria: { nombre: 'Bebidas' }, alergenos: [] },
          { id: 8, nombre: 'Manzana', precio: 0.80, emoji: '🍎', categoria: { nombre: 'Snacks' }, alergenos: [] },
          { id: 9, nombre: 'Barrita cereales', precio: 1.00, emoji: '🍫', categoria: { nombre: 'Snacks' }, alergenos: [] },
        ])
        setCargandoProductos(false)
      })
  }, [])

  useEffect(() => {
    const notifs = JSON.parse(localStorage.getItem('notificaciones') || '[]')
    setNotifNoLeidas(notifs.filter(n => !n.leida).length)
  }, [])

  useEffect(() => {
  localStorage.setItem('carrito', JSON.stringify(carrito))
}, [carrito])


  const categorias = ['Favoritos', ...new Set(productos.map(p => p.categoria?.nombre).filter(Boolean))]

  const productosFavoritos = productos.filter(p =>
    favoritos.includes(p.id) &&
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const productosPorCategoria = {
    Favoritos: productosFavoritos,
    ...[...new Set(productos.map(p => p.categoria?.nombre).filter(Boolean))].reduce((acc, cat) => {
      acc[cat] = productos.filter(p =>
        p.categoria?.nombre === cat &&
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
      )
      return acc
    }, {})
  }

  const toggleFavorito = (id) => {
    setFavoritos(prev => {
      const nuevos = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
      localStorage.setItem('favoritos', JSON.stringify(nuevos))
      return nuevos
    })
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollingPorClick.current) return
        entries.forEach(entry => {
          if (entry.isIntersecting) setCategoriaActiva(entry.target.dataset.categoria)
        })
      },
      { threshold: 0.3, rootMargin: '-80px 0px -60% 0px' }
    )
    Object.values(seccionesRef.current).forEach(el => { if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [busqueda, favoritos, productos])

  const irACategoria = (cat) => {
    setCategoriaActiva(cat)
    scrollingPorClick.current = true
    seccionesRef.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTimeout(() => { scrollingPorClick.current = false }, 800)
    const container = categoriasScrollRef.current
    const pill = container?.querySelector(`[data-cat="${cat}"]`)
    if (pill && container) {
      const offset = pill.offsetLeft - container.offsetWidth / 2 + pill.offsetWidth / 2
      container.scrollTo({ left: offset, behavior: 'smooth' })
    }
  }

  const totalCarrito = carrito.reduce((acc, p) => acc + Number(p.precio) * p.cantidad, 0)
  const totalArticulos = carrito.reduce((acc, p) => acc + p.cantidad, 0)
  const irAPedido = () => {
    localStorage.setItem('carrito', JSON.stringify(carrito))
    navigate('/pedido')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--crema)' }}>

      {/* HEADER FIJO */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--verde-oscuro)', padding: '24px 16px 0px' }}>
        <button onClick={() => navigate('/inicio')}
          style={{ background: 'none', border: 'none', color: 'rgba(245,240,232,0.8)', fontSize: 20, cursor: 'pointer', marginBottom: 6, display: 'block' }}>←</button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, color: 'rgba(245,240,232,0.7)' }}>
  {(() => {
    const hora = new Date().getHours()
    if (hora < 12) return `Buenos días, ${user.name || 'Usuario'}`
    if (hora < 20) return `Buenas tardes, ${user.name || 'Usuario'}`
    return `Buenas noches, ${user.name || 'Usuario'}`
  })()
  }
</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--crema)' }}>¿Qué quieres hoy?</div>
          </div>
          <button
            onClick={() => setMenuAbierto(true)}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--verde-medio)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: 'white', border: 'none', cursor: 'pointer', position: 'relative' }}
          >
            {user.name?.[0]?.toUpperCase() || 'U'}
            {notifNoLeidas > 0 && (
              <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#ff5252', color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {notifNoLeidas}
              </div>
            )}
          </button>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 50, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ color: 'rgba(245,240,232,0.6)', fontSize: 14 }}>🔍</span>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar producto..."
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--crema)', fontSize: 13, width: '100%' }}
          />
        </div>

        <div ref={categoriasScrollRef} style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 0 12px', scrollbarWidth: 'none' }}>
          {categorias.map(cat => (
            <button key={cat} data-cat={cat} onClick={() => irACategoria(cat)}
              style={{ whiteSpace: 'nowrap', fontSize: 12, padding: '7px 16px', borderRadius: 50, border: categoriaActiva === cat ? 'none' : '1.5px solid rgba(255,255,255,0.3)', background: categoriaActiva === cat ? 'var(--crema)' : 'transparent', color: categoriaActiva === cat ? 'var(--verde-oscuro)' : 'var(--crema)', fontWeight: categoriaActiva === cat ? 600 : 400, cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s ease' }}>
              {cat === 'Favoritos' ? '❤️ Favoritos' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* SECCIONES */}
      <div style={{ flex: 1, paddingBottom: carrito.length > 0 ? '90px' : '16px' }}>
        {cargandoProductos ? (
  <div style={{ textAlign: 'center', padding: 40, color: '#888', fontSize: 14 }}>
    Cargando productos...
  </div>
) : productos.length === 0 ? (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 80 }}>
    <div style={{ fontSize: 48 }}>🍽️</div>
    <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--gris-texto)' }}>
      Todavía no hay productos
    </div>
    <div style={{ fontSize: 13, color: '#888', textAlign: 'center', padding: '0 32px' }}>
      El menú se actualizará en breve
    </div>
  </div>
) : (
          categorias.map(cat => {
            const prods = productosPorCategoria[cat]
            if (!prods || prods.length === 0) return null
            return (
              <div key={cat} data-categoria={cat} ref={el => seccionesRef.current[cat] = el}>
                <div style={{ padding: '20px 16px 10px', fontSize: 16, fontWeight: 600, color: 'var(--gris-texto)' }}>
                  {cat === 'Favoritos' ? '❤️ Favoritos' : cat}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px' }}>
                  {prods.map(producto => (
                    <TarjetaProducto
                      key={producto.id}
                      producto={producto}
                      favoritos={favoritos}
                      toggleFavorito={toggleFavorito}
                      setCarrito={setCarrito}
                      navigate={navigate}
                    />
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* BARRA CARRITO */}
      {carrito.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, padding: '12px 16px 24px', background: 'white', borderTop: '1px solid #f0ede8', zIndex: 15 }}>
          <button onClick={irAPedido}
            style={{ width: '100%', background: 'var(--verde-oscuro)', color: 'var(--crema)', border: 'none', borderRadius: 50, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div style={{ fontSize: 11, opacity: 0.8 }}>{totalArticulos} artículo{totalArticulos > 1 ? 's' : ''}</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Ver pedido</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{totalCarrito.toFixed(2)}€</div>
          </button>
        </div>
      )}

      {/* MENÚ LATERAL — overlay */}
      {menuAbierto && (
        <div onClick={() => setMenuAbierto(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 20 }} />
      )}

      {/* MENÚ LATERAL — panel */}
      <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: '78%', maxWidth: 300, background: 'white', zIndex: 30, transform: menuAbierto ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.3s ease', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '52px 24px 28px', borderBottom: '1px solid #f0ede8', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--verde-medio)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'white', flexShrink: 0 }}>
            {user.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--gris-texto)', letterSpacing: -0.3 }}>{user.name?.toUpperCase() || 'USUARIO'}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>Ver perfil</div>
          </div>
          <button onClick={() => setMenuAbierto(false)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#888', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {[
            { icon: '🛍️', label: 'Mis pedidos', ruta: '/pedidos' },
            { icon: '🔔', label: 'Notificaciones', ruta: '/notificaciones', badge: notifNoLeidas },
          ].map(item => (
            <button key={item.label} onClick={() => { setMenuAbierto(false); navigate(item.ruta) }}
              style={{ width: '100%', background: 'none', border: 'none', borderBottom: '1px solid #f0ede8', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 16, color: 'var(--gris-texto)', fontWeight: 500, flex: 1 }}>{item.label}</span>
              {item.badge > 0 && (
                <div style={{ background: '#4CAF82', color: 'white', borderRadius: '50%', width: 20, height: 20, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.badge}
                </div>
              )}
              <span style={{ color: '#ccc', fontSize: 18 }}>›</span>
            </button>
          ))}
        </div>

        <div style={{ padding: '20px 24px 40px' }}>
          <button
            onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/') }}
            style={{ width: '100%', background: '#fff0f0', border: '1px solid #ffcdd2', borderRadius: 50, padding: '14px', fontSize: 14, fontWeight: 500, color: '#e53935', cursor: 'pointer' }}>
            🚪 Cerrar sesión
          </button>
        </div>
      </div>

    </div>
  )
}

export default Menu