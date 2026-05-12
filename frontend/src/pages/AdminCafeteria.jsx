import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// ── PESTAÑA DASHBOARD ────────────────────────────────
function PestañaDashboard() {
  const [stats, setStats] = useState(null)
  const [proximosPedidos, setProximosPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [tarjetaActiva, setTarjetaActiva] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/api/admin/stats/`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()),
      fetch(`${import.meta.env.VITE_API_URL}/api/admin/orders/`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json())
    ])
      .then(([statsData, pedidosData]) => {
        setStats(statsData)
        setProximosPedidos(Array.isArray(pedidosData) ? pedidosData : [])
        setCargando(false)
      })
      .catch(() => {
        setStats({ pedidos_hoy: 0, ingresos_hoy: 0, en_preparacion: 0, ticket_medio: 0, pedidos_semana: [], top_productos: [] })
        setProximosPedidos([])
        setCargando(false)
      })
  }, [])

  if (cargando) return <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Cargando dashboard...</div>

  const pedidosPendientes = proximosPedidos.filter(p => p.estado === 'PAGADO')
  const pedidosHoy = proximosPedidos
  const maxImporte = Math.max(...(stats.pedidos_semana?.map(d => d.pedidos) || [1]), 1)

  const renderDetalle = () => {
    if (!tarjetaActiva) return null

    const mensajeVacio = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 0' }}>
        <div style={{ fontSize: 36 }}>📋</div>
        <div style={{ fontSize: 14, color: '#888' }}>Todavía no se han realizado pedidos hoy</div>
      </div>
    )

    if (tarjetaActiva === 'pendientes') {
      return (
        <div style={{ background: 'white', borderRadius: 16, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--verde-oscuro)', marginBottom: 4 }}>
            Pedidos pendientes de preparar
          </div>
          {pedidosPendientes.length === 0 ? mensajeVacio : pedidosPendientes.map(pedido => (
            <div key={pedido.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f0ede8' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--verde-oscuro)', minWidth: 72 }}>{pedido.codigo}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#2a2a28' }}>{pedido.usuario?.first_name} {pedido.usuario?.last_name}</div>
                <div style={{ fontSize: 11, color: '#888' }}>
                  {pedido.lineas?.map(l => l.producto?.nombre).join(', ')}
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--verde-oscuro)' }}>{Number(pedido.total).toFixed(2)}€</div>
            </div>
          ))}
        </div>
      )
    }

    if (tarjetaActiva === 'total') {
      return (
        <div style={{ background: 'white', borderRadius: 16, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--verde-oscuro)', marginBottom: 4 }}>
            Todos los pedidos de hoy
          </div>
          {pedidosHoy.length === 0 ? mensajeVacio : pedidosHoy.map(pedido => {
            const colorEstado = {
              'PAGADO': { bg: '#e3f2fd', color: '#1565c0' },
              'LISTO': { bg: '#e8f5e9', color: '#2e7d32' },
              'ENTREGADO': { bg: '#f5f5f5', color: '#616161' },
            }[pedido.estado] || { bg: '#f5f5f5', color: '#616161' }
            return (
              <div key={pedido.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f0ede8' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--verde-oscuro)', minWidth: 72 }}>{pedido.codigo}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#2a2a28' }}>{pedido.usuario?.first_name} {pedido.usuario?.last_name}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>
                    ⏰ {pedido.franja?.hora_inicio?.slice(0, 5)} – {pedido.franja?.hora_fin?.slice(0, 5)}
                  </div>
                </div>
                <div style={{ background: colorEstado.bg, color: colorEstado.color, borderRadius: 50, padding: '3px 10px', fontSize: 11, fontWeight: 500 }}>
                  {pedido.estado}
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    if (tarjetaActiva === 'ingresos') {
  // Agrupar pedidos por franja
  const porFranja = pedidosHoy.reduce((acc, pedido) => {
    const key = `${pedido.franja?.hora_inicio?.slice(0, 5)} – ${pedido.franja?.hora_fin?.slice(0, 5)}`
    if (!acc[key]) acc[key] = { pedidos: 0, total: 0 }
    acc[key].pedidos += 1
    acc[key].total += Number(pedido.total)
    return acc
  }, {})

  return (
    <div style={{ background: 'white', borderRadius: 16, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--verde-oscuro)', marginBottom: 4 }}>
        Ingresos por franja horaria
      </div>
      {pedidosHoy.length === 0 ? mensajeVacio : (
        <>
          {Object.entries(porFranja).map(([franja, datos]) => (
            <div key={franja} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f0ede8' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#2a2a28' }}>⏰ {franja}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                  {datos.pedidos} pedido{datos.pedidos !== 1 ? 's' : ''}
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#2e7d32' }}>
                +{datos.total.toFixed(2)}€
              </div>
            </div>
          ))}
          <div style={{ borderTop: '2px solid #f0ede8', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gris-texto)' }}>Total del día</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--verde-oscuro)' }}>
              +{pedidosHoy.reduce((acc, p) => acc + Number(p.total), 0).toFixed(2)}€
            </span>
          </div>
        </>
      )}
    </div>
  )
}

    if (tarjetaActiva === 'ticket') {
      const importes = pedidosHoy.map(p => Number(p.total))
      const maxImporte = Math.max(...importes, 1)
      return (
        <div style={{ background: 'white', borderRadius: 16, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--verde-oscuro)', marginBottom: 4 }}>
            Importes de pedidos de hoy
          </div>
          {pedidosHoy.length === 0 ? mensajeVacio : (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
                {pedidosHoy.map((pedido, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontSize: 9, color: '#888' }}>{Number(pedido.total).toFixed(0)}€</div>
                    <div style={{
                      width: '100%',
                      background: 'var(--verde-oscuro)',
                      borderRadius: '4px 4px 0 0',
                      height: `${(Number(pedido.total) / maxImporte) * 60}px`,
                      minHeight: 4
                    }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', borderTop: '1px solid #f0ede8', paddingTop: 8 }}>
                <span>Ticket medio</span>
                <span style={{ fontWeight: 600, color: 'var(--verde-oscuro)' }}>
                  {(pedidosHoy.reduce((acc, p) => acc + Number(p.total), 0) / pedidosHoy.length).toFixed(2)}€
                </span>
              </div>
            </>
          )}
        </div>
      )
    }
  }

  const tarjetas = [
    { id: 'pendientes', label: 'Pedidos pendientes', valor: stats.en_preparacion, sufijo: '' },
    { id: 'total', label: 'Pedidos hoy', valor: stats.pedidos_hoy, sufijo: '' },
    { id: 'ingresos', label: 'Ingresos hoy', valor: stats.ingresos_hoy, sufijo: '€' },
    { id: 'ticket', label: 'Ticket medio', valor: stats.ticket_medio, sufijo: '€' },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Tarjetas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {tarjetas.map(tarjeta => (
          <button
            key={tarjeta.id}
            onClick={() => setTarjetaActiva(tarjetaActiva === tarjeta.id ? null : tarjeta.id)}
            style={{
              background: tarjetaActiva === tarjeta.id ? 'var(--verde-oscuro)' : 'white',
              border: tarjetaActiva === tarjeta.id ? 'none' : '1.5px solid #f0ede8',
              borderRadius: 16, padding: '16px',
              display: 'flex', flexDirection: 'column', gap: 4,
              cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 700, color: tarjetaActiva === tarjeta.id ? 'white' : 'var(--verde-oscuro)' }}>
              {tarjeta.valor}{tarjeta.sufijo}
            </div>
            <div style={{ fontSize: 11, color: tarjetaActiva === tarjeta.id ? 'rgba(255,255,255,0.7)' : '#888' }}>
              {tarjeta.label}
            </div>
          </button>
        ))}
      </div>

      {/* Detalle de la tarjeta activa */}
      {renderDetalle()}

    </div>
  )
}

// ── PESTAÑA PEDIDOS ──────────────────────────────────
function PestañaPedidos() {
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const intervalRef = useRef(null)

  const cargarPedidos = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/orders/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setPedidos(await res.json())
    } catch {
      setPedidos([
        { id: 1, codigo: 'A·47', estado: 'PREPARANDO', franja: { hora_inicio: '10:00', hora_fin: '10:15' }, total: '4.70', usuario: { first_name: 'Lucía', last_name: 'M.' }, lineas: [{ producto: { nombre: 'Bowl verde', emoji: '🥗' }, cantidad: 1 }, { producto: { nombre: 'Café', emoji: '☕' }, cantidad: 1 }] },
        { id: 2, codigo: 'A·48', estado: 'LISTO', franja: { hora_inicio: '10:00', hora_fin: '10:15' }, total: '7.40', usuario: { first_name: 'Carlos', last_name: 'R.' }, lineas: [{ producto: { nombre: 'Bocata mixto', emoji: '🥪' }, cantidad: 2 }, { producto: { nombre: 'Zumo', emoji: '🍊' }, cantidad: 1 }] },
        { id: 3, codigo: 'A·49', estado: 'PREPARANDO', franja: { hora_inicio: '10:00', hora_fin: '10:15' }, total: '2.20', usuario: { first_name: 'Marta', last_name: 'L.' }, lineas: [{ producto: { nombre: 'Smoothie fresa', emoji: '🍓' }, cantidad: 1 }] },
        { id: 4, codigo: 'B·01', estado: 'ENTREGADO', franja: { hora_inicio: '10:15', hora_fin: '10:30' }, total: '5.20', usuario: { first_name: 'Pablo', last_name: 'S.' }, lineas: [{ producto: { nombre: 'Ensalada', emoji: '🥗' }, cantidad: 1 }, { producto: { nombre: 'Café', emoji: '☕' }, cantidad: 1 }] },
      ])
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarPedidos()
    intervalRef.current = setInterval(cargarPedidos, 30000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const cambiarEstado = async (pedidoId, nuevoEstado) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${pedidoId}/status/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nuevoEstado })
      })
      if (res.ok) cargarPedidos()
    } catch {
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, estado: nuevoEstado } : p))
    }
  }

  const getColorEstado = (estado) => {
    switch (estado) {
      case 'PAGADO': return { bg: '#e3f2fd', color: '#1565c0', label: 'Nuevo' }
      case 'PREPARANDO': return { bg: '#fff3e0', color: '#e65100', label: 'Preparando' }
      case 'LISTO': return { bg: '#e8f5e9', color: '#2e7d32', label: 'Listo ✓' }
      case 'ENTREGADO': return { bg: '#f5f5f5', color: '#616161', label: 'Entregado' }
      default: return { bg: '#f5f5f5', color: '#616161', label: estado }
    }
  }

  const getSiguienteEstado = (estado) => {
  switch (estado) {
    case 'PAGADO': return { estado: 'LISTO', label: '✅ Marcar como listo' }
    case 'LISTO': return { estado: 'ENTREGADO', label: '📦 Marcar como entregado' }
    default: return null
  }
}

  // Agrupar por franja
  const pedidosPorFranja = pedidos.reduce((acc, pedido) => {
    const key = `${pedido.franja?.hora_inicio?.slice(0, 5)} – ${pedido.franja?.hora_fin?.slice(0, 5)}`
    if (!acc[key]) acc[key] = []
    acc[key].push(pedido)
    return acc
  }, {})

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {cargando ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Cargando pedidos...</div>
      ) : Object.keys(pedidosPorFranja).length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 }}>  
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--gris-texto)' }}>No hay pedidos pendientes</div>
        </div>
      ) : (
        Object.entries(pedidosPorFranja).map(([franja, pedidosFranja]) => (
          <div key={franja}>
            {/* Cabecera franja */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 13 }}>⏰</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gris-texto)' }}>{franja}</span>
              <span style={{ fontSize: 12, color: '#888' }}>{pedidosFranja.length} pedido{pedidosFranja.length > 1 ? 's' : ''}</span>
            </div>

            {/* Pedidos de esta franja */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pedidosFranja.map(pedido => {
                const colorEstado = getColorEstado(pedido.estado)
                const siguienteEstado = getSiguienteEstado(pedido.estado)
                return (
                  <div key={pedido.id} style={{ background: 'white', borderRadius: 14, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* Código */}
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--verde-oscuro)', minWidth: 48 }}>
                        {pedido.codigo}
                      </div>
                      {/* Info usuario */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#2a2a28' }}>
                          {pedido.usuario?.first_name} {pedido.usuario?.last_name}
                        </div>
                        <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                          {pedido.lineas?.map(l => `${l.producto?.nombre}${l.cantidad > 1 ? ` x${l.cantidad}` : ''}`).join(' · ')}
                        </div>
                      </div>
                      {/* Estado badge */}
                      <div style={{ background: colorEstado.bg, color: colorEstado.color, borderRadius: 50, padding: '3px 10px', fontSize: 11, fontWeight: 500, flexShrink: 0 }}>
                        {colorEstado.label}
                      </div>
                    </div>

                    {/* Botón cambiar estado */}
                    {siguienteEstado && (
                      <button
                        onClick={() => cambiarEstado(pedido.id, siguienteEstado.estado)}
                        style={{ width: '100%', background: siguienteEstado.estado === 'LISTO' ? '#4CAF82' : 'var(--verde-oscuro)', color: 'white', border: 'none', borderRadius: 50, padding: '8px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                      >
                        {siguienteEstado.estado === 'PREPARANDO' ? '🍳 Empezar preparación' : siguienteEstado.estado === 'LISTO' ? '✅ Marcar como listo' : '📦 Entregado'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ── PESTAÑA MENÚ ─────────────────────────────────────
function PestañaMenu() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [productoEditando, setProductoEditando] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [alergenosDisponibles, setAlergenosDisponibles] = useState([])
  const [imagenPreview, setImagenPreview] = useState(null)
  const [imagenFile, setImagenFile] = useState(null)
  const [confirmEliminar, setConfirmEliminar] = useState(null)
  const fileInputRef = useRef(null)

  const formInicial = { nombre: '', precio: '', descripcion: '', emoji: '', categoria_id: '', disponible: true, alergenos: [] }
  const [form, setForm] = useState(formInicial)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    try {
      const [prodRes, catRes, alerRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/products/`),
        fetch(`${import.meta.env.VITE_API_URL}/api/categorias/`),
        fetch(`${import.meta.env.VITE_API_URL}/api/alergenos/`)
      ])
      if (prodRes.ok) setProductos(await prodRes.json())
      if (catRes.ok) setCategorias(await catRes.json())
      if (alerRes.ok) setAlergenosDisponibles(await alerRes.json())
    } catch {
      setProductos([
        { id: 1, nombre: 'Bowl verde', precio: '3.50', emoji: '🥗', disponible: true, categoria: { id: 1, nombre: 'Ensaladas' }, alergenos: [] },
        { id: 2, nombre: 'Ensalada César', precio: '4.00', emoji: '🥙', disponible: false, categoria: { id: 1, nombre: 'Ensaladas' }, alergenos: [] },
        { id: 3, nombre: 'Bocata mixto', precio: '2.80', emoji: '🥪', disponible: true, categoria: { id: 2, nombre: 'Bocatas' }, alergenos: [] },
        { id: 4, nombre: 'Porción pizza', precio: '2.50', emoji: '🍕', disponible: true, categoria: { id: 2, nombre: 'Bocatas' }, alergenos: [] },
      ])
      setCategorias([{ id: 1, nombre: 'Ensaladas' }, { id: 2, nombre: 'Bocatas' }, { id: 3, nombre: 'Bebidas' }])
      setAlergenosDisponibles([
        { id: 1, nombre: 'gluten', nombre_display: 'Gluten' },
        { id: 2, nombre: 'leche', nombre_display: 'Leche' },
        { id: 3, nombre: 'huevos', nombre_display: 'Huevos' },
        { id: 4, nombre: 'pescado', nombre_display: 'Pescado' },
        { id: 5, nombre: 'soja', nombre_display: 'Soja' },
        { id: 6, nombre: 'cacahuetes', nombre_display: 'Cacahuetes' },
        { id: 7, nombre: 'frutos_cascara', nombre_display: 'Frutos de cáscara' },
        { id: 8, nombre: 'apio', nombre_display: 'Apio' },
        { id: 9, nombre: 'mostaza', nombre_display: 'Mostaza' },
        { id: 10, nombre: 'sesamo', nombre_display: 'Sésamo' },
        { id: 11, nombre: 'dioxido_azufre', nombre_display: 'Dióxido de azufre' },
        { id: 12, nombre: 'altramuces', nombre_display: 'Altramuces' },
        { id: 13, nombre: 'moluscos', nombre_display: 'Moluscos' },
        { id: 14, nombre: 'crustaceos', nombre_display: 'Crustáceos' },
      ])
    } finally {
      setCargando(false)
    }
  }

  const handleImagenChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImagenFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagenPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleGuardar = async () => {
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      Object.entries(form).forEach(([key, val]) => {
        if (key === 'alergenos') val.forEach(a => formData.append('alergenos', a))
        else formData.append(key, val)
      })
      if (imagenFile) formData.append('imagen', imagenFile)
      const url = productoEditando ? `${import.meta.env.VITE_API_URL}/api/products/${productoEditando.id}/` : `${import.meta.env.VITE_API_URL}/api/products/`
      const method = productoEditando ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: formData })
      if (res.ok) { cargarDatos(); cerrarFormulario() }
    } catch { cargarDatos(); cerrarFormulario() }
  }

  const eliminarProducto = async (id) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}/`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      cargarDatos()
    } catch {
      setProductos(prev => prev.filter(p => p.id !== id))
    }
    setConfirmEliminar(null)
  }

  const cerrarFormulario = () => {
    setMostrarFormulario(false)
    setProductoEditando(null)
    setForm(formInicial)
    setImagenPreview(null)
    setImagenFile(null)
  }

  const abrirEditar = (producto) => {
    setProductoEditando(producto)
    setForm({ nombre: producto.nombre, precio: producto.precio, descripcion: producto.descripcion || '', emoji: producto.emoji || '', categoria_id: producto.categoria?.id || '', disponible: producto.disponible, alergenos: producto.alergenos?.map(a => a.id) || [] })
    setImagenPreview(producto.imagen || null)
    setMostrarFormulario(true)
  }

  const toggleDisponible = async (producto) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${import.meta.env.VITE_API_URL}/api/inventory/${producto.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ disponible: !producto.disponible })
      })
      cargarDatos()
    } catch {
      setProductos(prev => prev.map(p => p.id === producto.id ? { ...p, disponible: !p.disponible } : p))
    }
  }

  const toggleAlergeno = (id) => {
    setForm(prev => ({ ...prev, alergenos: prev.alergenos.includes(id) ? prev.alergenos.filter(a => a !== id) : [...prev.alergenos, id] }))
  }

  // Agrupar por categoría
  const productosPorCategoria = productos.reduce((acc, p) => {
    const cat = p.categoria?.nombre || 'Sin categoría'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '100px' }}>

      {/* Modal confirmar eliminar */}
      {confirmEliminar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '24px', width: '100%', maxWidth: 320 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#2a2a28', marginBottom: 8 }}>¿Eliminar producto?</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Esta acción no se puede deshacer.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => eliminarProducto(confirmEliminar)} style={{ flex: 1, background: '#ff5252', color: 'white', border: 'none', borderRadius: 50, padding: '12px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Eliminar</button>
              <button onClick={() => setConfirmEliminar(null)} style={{ flex: 1, background: 'var(--crema)', color: 'var(--gris-texto)', border: 'none', borderRadius: 50, padding: '12px', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => { cerrarFormulario(); setMostrarFormulario(true) }}
        style={{ width: '100%', background: 'var(--verde-oscuro)', color: 'white', border: 'none', borderRadius: 50, padding: '13px', fontSize: 14, fontWeight: 500, cursor: 'pointer', marginBottom: 16 }}>
        + Añadir producto
      </button>

      {/* Formulario */}
      {mostrarFormulario && (
        <div style={{ background: 'white', borderRadius: 16, padding: '16px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--verde-oscuro)' }}>{productoEditando ? 'Editar producto' : 'Nuevo producto'}</div>
          <div onClick={() => fileInputRef.current?.click()}
            style={{ height: 140, borderRadius: 12, border: '2px dashed #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', background: 'var(--crema)' }}>
            {imagenPreview ? <img src={imagenPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center', color: '#888' }}><div style={{ fontSize: 32, marginBottom: 6 }}>📷</div><div style={{ fontSize: 12 }}>Toca para subir imagen</div></div>}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagenChange} style={{ display: 'none' }} />
          <input placeholder="Nombre del producto" value={form.nombre} onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))} style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #ddd', fontSize: 13, outline: 'none', fontFamily: 'Inter, sans-serif' }} />
          <input type="number" step="0.01" min="0" placeholder="Precio (ej: 3.50)" value={form.precio} onChange={e => setForm(prev => ({ ...prev, precio: e.target.value }))} style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #ddd', fontSize: 13, outline: 'none', fontFamily: 'Inter, sans-serif' }} />
          <input placeholder="Emoji (ej: 🥗) — opcional si hay imagen" value={form.emoji} onChange={e => setForm(prev => ({ ...prev, emoji: e.target.value }))} style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #ddd', fontSize: 13, outline: 'none', fontFamily: 'Inter, sans-serif' }} />
          <textarea placeholder="Descripción del producto (opcional)" value={form.descripcion} onChange={e => setForm(prev => ({ ...prev, descripcion: e.target.value }))} rows={3} style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #ddd', fontSize: 13, outline: 'none', fontFamily: 'Inter, sans-serif', resize: 'none' }} />
          <select value={form.categoria_id} onChange={e => setForm(prev => ({ ...prev, categoria_id: e.target.value }))} style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #ddd', fontSize: 13, outline: 'none', fontFamily: 'Inter, sans-serif', background: 'white' }}>
            <option value="">Selecciona categoría</option>
            {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
          </select>
          <div style={{ fontSize: 11, color: '#999', marginTop: -6 }}>Para añadir categorías ve a ⚙️ Ajustes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--gris-texto)' }}>Alérgenos</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {alergenosDisponibles.map(alergeno => (
                <button key={alergeno.id} onClick={() => toggleAlergeno(alergeno.id)}
                  style={{ padding: '5px 12px', borderRadius: 50, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif', border: form.alergenos.includes(alergeno.id) ? 'none' : '1.5px solid #ddd', background: form.alergenos.includes(alergeno.id) ? 'var(--verde-oscuro)' : 'white', color: form.alergenos.includes(alergeno.id) ? 'white' : 'var(--gris-texto)', fontWeight: form.alergenos.includes(alergeno.id) ? 500 : 400 }}>
                  {alergeno.nombre_display}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={handleGuardar} style={{ flex: 1, background: '#4CAF82', color: 'white', border: 'none', borderRadius: 50, padding: '12px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Guardar</button>
            <button onClick={cerrarFormulario} style={{ flex: 1, background: 'var(--crema)', color: 'var(--gris-texto)', border: 'none', borderRadius: 50, padding: '12px', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Lista por categorías */}
      {cargando ? <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Cargando productos...</div> : (
        Object.entries(productosPorCategoria).map(([cat, prods]) => (
          <div key={cat} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{cat}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {prods.map(producto => (
                <div key={producto.id} style={{ background: 'white', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  {producto.imagen
                    ? <img src={producto.imagen} alt={producto.nombre} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} />
                    : <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--crema)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{producto.emoji}</div>
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#2a2a28' }}>{producto.nombre}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{Number(producto.precio).toFixed(2)}€ · {producto.categoria?.nombre}</div>
                  </div>
                  {/* Toggle disponible */}
                  <div
                    onClick={() => toggleDisponible(producto)}
                    style={{ width: 44, height: 26, borderRadius: 50, background: producto.disponible ? 'var(--verde-oscuro)' : '#ddd', position: 'relative', cursor: 'pointer', transition: 'background 0.2s ease', flexShrink: 0 }}
                  >
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: producto.disponible ? 21 : 3, transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                  <button onClick={() => abrirEditar(producto)} style={{ background: 'var(--crema)', border: 'none', borderRadius: 10, padding: '6px 10px', fontSize: 13, cursor: 'pointer' }}>✏️</button>
                  <button onClick={() => setConfirmEliminar(producto.id)} style={{ background: '#ffebee', border: 'none', borderRadius: 10, padding: '6px 10px', fontSize: 13, cursor: 'pointer' }}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ── PESTAÑA ANÁLISIS ─────────────────────────────────
function PestañaAnalisis() {
  const [stats, setStats] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [graficaActiva, setGraficaActiva] = useState('pedidos')

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/stats/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { setStats(data); setCargando(false) })
      .catch(() => {
        setStats({
          pedidos_hoy: 0,
          ingresos_hoy: 0,
          en_preparacion: 0,
          ticket_medio: 0,
          pedidos_semana: [
            { dia: 'Lun', pedidos: 0, ingresos: 0, esHoy: false },
            { dia: 'Mar', pedidos: 0, ingresos: 0, esHoy: false },
            { dia: 'Mié', pedidos: 0, ingresos: 0, esHoy: false },
            { dia: 'Jue', pedidos: 0, ingresos: 0, esHoy: false },
            { dia: 'Vie', pedidos: 0, ingresos: 0, esHoy: true },
          ],
          top_productos: []
        })
        setCargando(false)
      })
  }, [])

  if (cargando) return <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Cargando análisis...</div>

  const maxPedidos = Math.max(...stats.pedidos_semana.map(d => d.pedidos), 1)
  const maxIngresos = Math.max(...stats.pedidos_semana.map(d => d.ingresos), 1)

  const hayDatos = stats.pedidos_semana.some(d => d.pedidos > 0)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Selector de gráfica */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { id: 'pedidos', label: '📦 Pedidos' },
          { id: 'ingresos', label: '💶 Ingresos' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setGraficaActiva(tab.id)}
            style={{
              flex: 1, padding: '10px', borderRadius: 50,
              border: graficaActiva === tab.id ? 'none' : '1.5px solid #ddd',
              background: graficaActiva === tab.id ? 'var(--verde-oscuro)' : 'white',
              color: graficaActiva === tab.id ? 'white' : 'var(--gris-texto)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Gráfico */}
      <div style={{ background: 'white', borderRadius: 16, padding: '16px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gris-texto)', marginBottom: 4 }}>
          {graficaActiva === 'pedidos' ? 'Pedidos por día' : 'Ingresos por día'}
        </div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>
          Semana actual
        </div>

        {!hayDatos ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 0' }}>
            <div style={{ fontSize: 36 }}>📊</div>
            <div style={{ fontSize: 14, color: '#888' }}>Todavía no hay datos esta semana</div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
            {stats.pedidos_semana.map((item, i) => {
              const valor = graficaActiva === 'pedidos' ? item.pedidos : item.ingresos
              const max = graficaActiva === 'pedidos' ? maxPedidos : maxIngresos
              const altura = Math.max((valor / max) * 90, valor > 0 ? 8 : 0)
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 10, color: item.esHoy ? 'var(--verde-oscuro)' : '#888', fontWeight: item.esHoy ? 600 : 400 }}>
                    {graficaActiva === 'pedidos' ? valor : `${valor}€`}
                  </div>
                  <div style={{
                    width: '100%',
                    background: item.esHoy ? 'var(--verde-oscuro)' : 'var(--verde-claro)',
                    borderRadius: '6px 6px 0 0',
                    height: `${altura}px`,
                    minHeight: valor > 0 ? 4 : 0,
                    transition: 'height 0.3s ease'
                  }} />
                  <div style={{
                    fontSize: 11,
                    color: item.esHoy ? 'var(--verde-oscuro)' : '#888',
                    fontWeight: item.esHoy ? 600 : 400
                  }}>
                    {item.dia}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Productos más pedidos */}
      <div style={{ background: 'white', borderRadius: 16, padding: '16px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gris-texto)', marginBottom: 12 }}>
          Productos más pedidos
        </div>
        {stats.top_productos.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 0' }}>
            <div style={{ fontSize: 36 }}>🍽️</div>
            <div style={{ fontSize: 14, color: '#888' }}>Todavía no hay ventas registradas</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.top_productos.map((prod, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#888', minWidth: 20 }}>{i + 1}</div>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'var(--crema)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, overflow: 'hidden'
                }}>
                  {prod.producto__imagen
                    ? <img src={prod.producto__imagen.startsWith('http') ? prod.producto__imagen : `${import.meta.env.VITE_API_URL}${prod.producto__imagen}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : prod.producto__emoji
                  }
                </div>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#2a2a28' }}>
                  {prod.producto__nombre}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--verde-oscuro)' }}>
                  {prod.total_vendido} uds
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

// ── PESTAÑA AJUSTES ──────────────────────────────────
function PestañaAjustes() {
  const [config, setConfig] = useState(null)
  const [franjas, setFranjas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [nuevaFranja, setNuevaFranja] = useState({ hora_inicio: '', hora_fin: '' })
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [confirmEliminarFranja, setConfirmEliminarFranja] = useState(null)
  const [confirmEliminarCat, setConfirmEliminarCat] = useState(null)
  const [imagenInicioPreview, setImagenInicioPreview] = useState(null)
  const [imagenInicioFile, setImagenInicioFile] = useState(null)
  const imagenInicioRef = useRef(null)
  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
  try {
    const [confRes, franjasRes, catRes] = await Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/api/config/`),
      fetch(`${import.meta.env.VITE_API_URL}/api/franjas/`),
      fetch(`${import.meta.env.VITE_API_URL}/api/categorias/`)
    ])
    if (confRes.ok) {
      const confData = await confRes.json()
      setConfig(confData)
      if (confData.imagen_inicio) setImagenInicioPreview(confData.imagen_inicio)
    }
    if (franjasRes.ok) setFranjas(await franjasRes.json())
    if (catRes.ok) setCategorias(await catRes.json())
  } catch {
    setConfig({ hora_apertura: '08:45', hora_cierre: '14:30', hora_corte_turno1: '10:30', hora_inicio_recreo: '11:15', hora_fin_recreo: '11:45' })
    setFranjas([])
    setCategorias([{ id: 1, nombre: 'Ensaladas' }, { id: 2, nombre: 'Bocatas' }])
  }
}

  const guardarImagenInicio = async () => {
  try {
    const formData = new FormData()
    formData.append('imagen_inicio', imagenInicioFile)
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/config/`, {
      method: 'PUT',
      body: formData
    })
    if (res.ok) {
      const data = await res.json()
      if (data.imagen_inicio) setImagenInicioPreview(data.imagen_inicio)
      setImagenInicioFile(null)
      alert('Imagen guardada correctamente')
    } else {
      alert('Error al guardar: ' + res.status)
    }
  } catch (err) {
    alert('Error al guardar la imagen: ' + err.message)
  }
}

  const guardarConfig = async () => {
    setGuardando(true)
    try {
      const token = localStorage.getItem('token')
      await fetch(`${import.meta.env.VITE_API_URL}/api/config/`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(config) })
    } catch { }
    setGuardando(false)
  }

  const handleImagenInicio = (e) => {
  const file = e.target.files[0]
  if (!file) return
  setImagenInicioFile(file)
  const reader = new FileReader()
  reader.onloadend = () => setImagenInicioPreview(reader.result)
  reader.readAsDataURL(file)
    }
  const añadirFranja = async () => {
    if (!nuevaFranja.hora_inicio || !nuevaFranja.hora_fin) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/franjas/`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...nuevaFranja, activa: true }) })
      if (res.ok) cargarDatos()
    } catch { setFranjas(prev => [...prev, { id: Date.now(), ...nuevaFranja }]) }
    setNuevaFranja({ hora_inicio: '', hora_fin: '' })
  }

  const eliminarFranja = async (id) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${import.meta.env.VITE_API_URL}/api/franjas/${id}/`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      cargarDatos()
    } catch { setFranjas(prev => prev.filter(f => f.id !== id)) }
    setConfirmEliminarFranja(null)
  }

  const añadirCategoria = async () => {
    if (!nuevaCategoria.trim()) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categorias/`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ nombre: nuevaCategoria }) })
      if (res.ok) { setNuevaCategoria(''); cargarDatos() }
    } catch { setCategorias(prev => [...prev, { id: Date.now(), nombre: nuevaCategoria }]); setNuevaCategoria('') }
  }

  const eliminarCategoria = async (id) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${import.meta.env.VITE_API_URL}/api/categorias/${id}/`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      cargarDatos()
    } catch { setCategorias(prev => prev.filter(c => c.id !== id)) }
    setConfirmEliminarCat(null)
  }

  if (!config) return <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Cargando...</div>

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {confirmEliminarFranja && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '24px', width: '100%', maxWidth: 320 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>¿Eliminar franja?</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Esta acción no se puede deshacer.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => eliminarFranja(confirmEliminarFranja)} style={{ flex: 1, background: '#ff5252', color: 'white', border: 'none', borderRadius: 50, padding: '12px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Eliminar</button>
              <button onClick={() => setConfirmEliminarFranja(null)} style={{ flex: 1, background: 'var(--crema)', color: 'var(--gris-texto)', border: 'none', borderRadius: 50, padding: '12px', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {confirmEliminarCat && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '24px', width: '100%', maxWidth: 320 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>¿Eliminar categoría?</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Los productos quedarán sin categoría asignada.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => eliminarCategoria(confirmEliminarCat)} style={{ flex: 1, background: '#ff5252', color: 'white', border: 'none', borderRadius: 50, padding: '12px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Eliminar</button>
              <button onClick={() => setConfirmEliminarCat(null)} style={{ flex: 1, background: 'var(--crema)', color: 'var(--gris-texto)', border: 'none', borderRadius: 50, padding: '12px', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Imagen de inicio */}
<div style={{ background: 'white', borderRadius: 16, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--verde-oscuro)' }}>🖼️ Imagen de inicio</div>
  <div style={{ fontSize: 12, color: '#888' }}>
    Esta imagen aparece en la pantalla de inicio cuando el usuario entra a la app
  </div>
  <div
    onClick={() => imagenInicioRef.current?.click()}
    style={{
      height: 160, borderRadius: 12, border: '2px dashed #ddd',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', overflow: 'hidden', background: 'var(--crema)'
    }}
  >
    {imagenInicioPreview ? (
      <img src={imagenInicioPreview} alt="inicio" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    ) : (
      <div style={{ textAlign: 'center', color: '#888' }}>
        <div style={{ fontSize: 32, marginBottom: 6 }}>📷</div>
        <div style={{ fontSize: 12 }}>Toca para subir imagen</div>
      </div>
    )}
  </div>
  <input ref={imagenInicioRef} type="file" accept="image/*" onChange={handleImagenInicio} style={{ display: 'none' }} />
  {imagenInicioFile && (
    <button
      onClick={guardarImagenInicio}
      style={{ background: '#4CAF82', color: 'white', border: 'none', borderRadius: 50, padding: '12px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
    >
      Guardar imagen
    </button>
  )}
</div>


      {/* Horarios */}
      <div style={{ background: 'white', borderRadius: 16, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--verde-oscuro)' }}>⏰ Horarios</div>
        {[
          { key: 'hora_apertura', label: 'Apertura' },
          { key: 'hora_cierre', label: 'Cierre' },
          { key: 'hora_corte_turno1', label: 'Corte turno 1' },
          { key: 'hora_inicio_recreo', label: 'Recreo' },
          { key: 'hora_fin_recreo', label: 'Inicio turno 2' },
        ].map(field => (
          <div key={field.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--gris-texto)' }}>{field.label}</span>
            <input type="time" value={config[field.key]?.slice(0, 5) || ''} onChange={e => setConfig(prev => ({ ...prev, [field.key]: e.target.value }))} style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #ddd', fontSize: 13, outline: 'none' }} />
          </div>
        ))}
        <button onClick={guardarConfig} style={{ background: '#4CAF82', color: 'white', border: 'none', borderRadius: 50, padding: '12px', fontSize: 14, fontWeight: 500, cursor: 'pointer', marginTop: 4 }}>
          {guardando ? 'Guardando...' : 'Guardar horarios'}
        </button>
      </div>

      {/* Franjas */}
      <div style={{ background: 'white', borderRadius: 16, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--verde-oscuro)' }}>🕐 Franjas de recogida</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="time" value={nuevaFranja.hora_inicio} onChange={e => setNuevaFranja(prev => ({ ...prev, hora_inicio: e.target.value }))} style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1.5px solid #ddd', fontSize: 13, outline: 'none' }} />
          <span style={{ color: '#888', fontSize: 12 }}>–</span>
          <input type="time" value={nuevaFranja.hora_fin} onChange={e => setNuevaFranja(prev => ({ ...prev, hora_fin: e.target.value }))} style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1.5px solid #ddd', fontSize: 13, outline: 'none' }} />
          <button onClick={añadirFranja} style={{ background: 'var(--verde-oscuro)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 16, cursor: 'pointer' }}>+</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {franjas.map(franja => (
            <div key={franja.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--crema)', borderRadius: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{franja.hora_inicio?.slice(0, 5)} – {franja.hora_fin?.slice(0, 5)}</span>
              <button onClick={() => setConfirmEliminarFranja(franja.id)} style={{ background: 'none', border: 'none', color: '#ff5252', fontSize: 16, cursor: 'pointer' }}>🗑️</button>
            </div>
          ))}
        </div>
      </div>

      {/* Categorías */}
      <div style={{ background: 'white', borderRadius: 16, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--verde-oscuro)' }}>🏷️ Categorías</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Nueva categoría" value={nuevaCategoria} onChange={e => setNuevaCategoria(e.target.value)} onKeyDown={e => e.key === 'Enter' && añadirCategoria()} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #ddd', fontSize: 13, outline: 'none', fontFamily: 'Inter, sans-serif' }} />
          <button onClick={añadirCategoria} style={{ background: 'var(--verde-oscuro)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 16, cursor: 'pointer' }}>+</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {categorias.map(cat => (
            <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--crema)', borderRadius: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{cat.nombre}</span>
              <button onClick={() => setConfirmEliminarCat(cat.id)} style={{ background: 'none', border: 'none', color: '#ff5252', fontSize: 16, cursor: 'pointer' }}>🗑️</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── ADMIN CAFETERIA PRINCIPAL ────────────────────────
function AdminCafeteria() {
  const navigate = useNavigate()
  const [pestañaActiva, setPestañaActiva] = useState('dashboard')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })

  const getTitulo = () => {
    switch (pestañaActiva) {
      case 'dashboard': return 'API Cafetería'
      case 'pedidos': return 'Pedidos'
      case 'menu': return 'Menú'
      case 'analisis': return 'Análisis'
      case 'ajustes': return 'Ajustes'
      default: return 'API Cafetería'
    }
  }

  const getSubtitulo = () => {
    switch (pestañaActiva) {
      case 'dashboard': return `Hoy · ${hoy}`
      case 'pedidos': return 'Gestiona y cambia estados'
      case 'menu': return 'Activa, desactiva o añade productos'
      case 'analisis': return `Semana actual · ${hoy}`
      case 'ajustes': return 'Configuración general'
      default: return ''
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--crema)' }}>

      {/* HEADER */}
      <div style={{ background: 'var(--verde-oscuro)', padding: '48px 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            {pestañaActiva !== 'dashboard' && (
              <button onClick={() => setPestañaActiva('dashboard')}
                style={{ background: 'none', border: 'none', color: 'rgba(245,240,232,0.7)', fontSize: 13, cursor: 'pointer', marginBottom: 4, display: 'block', padding: 0 }}>
                ← Volver
              </button>
            )}
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--crema)' }}>{getTitulo()}</div>
            <div style={{ fontSize: 12, color: 'rgba(245,240,232,0.6)', marginTop: 2 }}>{getSubtitulo()}</div>
          </div>
          <div
  style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--verde-medio)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', cursor: 'pointer' }}
  onClick={() => {
    if (window.confirm('¿Seguro que quieres cerrar sesión?')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      navigate('/')
    }
  }}
>
  {user.name?.[0]?.toUpperCase() || 'AD'}
</div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {pestañaActiva === 'dashboard' && <PestañaDashboard />}
        {pestañaActiva === 'pedidos' && <PestañaPedidos />}
        {pestañaActiva === 'menu' && <PestañaMenu />}
        {pestañaActiva === 'analisis' && <PestañaAnalisis />}
        {pestañaActiva === 'ajustes' && <PestañaAjustes />}
      </div>

      {/* BARRA NAVEGACIÓN INFERIOR */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'white', borderTop: '1px solid #f0ede8', display: 'flex', zIndex: 10 }}>
        {[
          { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
          { id: 'pedidos', icon: '🛍️', label: 'Pedidos' },
          { id: 'menu', icon: '🍽️', label: 'Menú' },
          { id: 'analisis', icon: '📊', label: 'Análisis' },
          { id: 'ajustes', icon: '⚙️', label: 'Ajustes' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setPestañaActiva(tab.id)}
            style={{ flex: 1, background: 'none', border: 'none', padding: '10px 0 18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: pestañaActiva === tab.id ? 600 : 400, color: pestañaActiva === tab.id ? 'var(--verde-oscuro)' : '#aaa' }}>
              {tab.label}
            </span>
            {pestañaActiva === tab.id && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--verde-oscuro)' }} />}
          </button>
        ))}
      </div>

    </div>
  )
}

export default AdminCafeteria