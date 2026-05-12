import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Inicio() {
  const navigate = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [notifNoLeidas, setNotifNoLeidas] = useState(0)
  const [imagenInicio, setImagenInicio] = useState(null)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/config/`)
      .then(res => res.json())
      .then(data => {
        if (data.imagen_inicio) {
          const url = data.imagen_inicio.startsWith('http')
            ? data.imagen_inicio
            : `${import.meta.env.VITE_API_URL}${data.imagen_inicio}`
          setImagenInicio(url)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const notifs = JSON.parse(localStorage.getItem('notificaciones') || '[]')
    setNotifNoLeidas(notifs.filter(n => !n.leida).length)
  }, [])

  const handleCerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'white' }}>

      {/* IMAGEN SUPERIOR */}
      <div style={{
        position: 'relative',
        height: '68vh',
        background: 'linear-gradient(135deg, #2D4A3E 0%, #4a7a65 40%, #3d6354 100%)',
        overflow: 'hidden'
      }}>
        {imagenInicio && (
          <img
            src={imagenInicio}
            alt="cafetería"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', zIndex: 0
            }}
          />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.15) 100%)',
          zIndex: 1
        }} />

        {/* HEADER */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          zIndex: 10,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '36px 16px 16px'
        }}>
          <button
            onClick={() => setMenuAbierto(true)}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none',
              borderRadius: 12, padding: '10px 12px',
              cursor: 'pointer', backdropFilter: 'blur(10px)'
            }}
          >
            <div style={{ width: 20, height: 2, background: 'white', marginBottom: 5 }} />
            <div style={{ width: 20, height: 2, background: 'white', marginBottom: 5 }} />
            <div style={{ width: 14, height: 2, background: 'white' }} />
          </button>
        </div>

        {/* SALUDO */}
        <div style={{ position: 'absolute', top: 100, left: 24, zIndex: 10 }}>
          <div style={{
            fontSize: 42, fontWeight: 700,
            color: 'white', lineHeight: 1.1,
            letterSpacing: -1, textTransform: 'uppercase',
            fontFamily: 'Inter, sans-serif'
          }}>
            HOLA,<br />{user.name?.toUpperCase() || 'USUARIO'}.
          </div>
          <div style={{
            fontSize: 15, color: 'rgba(255,255,255,0.8)',
            marginTop: 8, lineHeight: 1.5,
            fontFamily: 'Inter, sans-serif'
          }}>
            ¿Qué vas a pedir hoy?
          </div>
        </div>
      </div>

      {/* FRANJA INFERIOR BLANCA */}
      <div style={{
        background: 'white',
        padding: '28px 24px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 12
      }}>
        <button
          onClick={() => navigate('/menu')}
          style={{
            width: '100%', background: '#1a1a18',
            color: 'white', border: 'none',
            borderRadius: 50, padding: '18px 24px',
            fontSize: 16, fontWeight: 600,
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer', fontFamily: 'Inter, sans-serif'
          }}
        >
          <span>Pide ahora</span>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, lineHeight: 1, paddingLeft: 2
          }}>→</div>
        </button>
      </div>

      {/* MENÚ LATERAL — overlay */}
      {menuAbierto && (
        <div
          onClick={() => setMenuAbierto(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 20 }}
        />
      )}

      {/* MENÚ LATERAL — panel */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: '78%', maxWidth: 300,
        background: 'var(--verde-oscuro)',
        zIndex: 30,
        transform: menuAbierto ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{
          padding: '52px 24px 28px',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', gap: 14
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--verde-medio)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: 'white', flexShrink: 0
          }}>
            {user.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'white', letterSpacing: -0.3, fontFamily: 'Inter, sans-serif' }}>
              {user.name?.toUpperCase() || 'USUARIO'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3, fontFamily: 'Inter, sans-serif' }}>
              Ver perfil
            </div>
          </div>
          <button
            onClick={() => setMenuAbierto(false)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}
          >✕</button>
        </div>

        <div style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {[
            { icon: '🛍️', label: 'Mis pedidos', ruta: '/pedidos' },
            { icon: '🔔', label: 'Notificaciones', ruta: '/notificaciones', badge: notifNoLeidas },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => { setMenuAbierto(false); navigate(item.ruta) }}
              style={{
                width: '100%', background: 'none', border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.12)',
                padding: '18px 24px',
                display: 'flex', alignItems: 'center', gap: 16,
                cursor: 'pointer', textAlign: 'left'
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 16, color: 'white', fontWeight: 500, letterSpacing: -0.2, fontFamily: 'Inter, sans-serif', flex: 1 }}>
                {item.label}
              </span>
              {item.badge > 0 && (
                <div style={{ background: '#4CAF82', color: 'white', borderRadius: '50%', width: 20, height: 20, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.badge}
                </div>
              )}
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }}>›</span>
            </button>
          ))}
        </div>

        <div style={{ padding: '20px 24px 40px' }}>
          <button
            onClick={handleCerrarSesion}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 50, padding: '14px', fontSize: 14,
              fontWeight: 500, color: '#ff8a80',
              cursor: 'pointer', letterSpacing: -0.2,
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

    </div>
  )
}

export default Inicio