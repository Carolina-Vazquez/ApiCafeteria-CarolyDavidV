import { useNavigate } from 'react-router-dom'

function Login() {
  const navigate = useNavigate()

  const handleGoogleLogin = () => {
    // Simulamos login — cambiar is_staff a true para probar vista admin
    const esAdmin = false // cambiar a true para probar admin

    localStorage.setItem('token', 'token-prueba')
    localStorage.setItem('user', JSON.stringify({
      name: esAdmin ? 'Admin Cafetería' : 'Carolina',
      email: esAdmin ? 'admin@cafeteria.com' : 'carolina@gmail.com',
      avatar: null,
      is_staff: esAdmin
    }))

    if (esAdmin) {
      navigate('/admin-cafeteria')
    } else {
      navigate('/inicio')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: 'var(--verde-oscuro)',
        height: '240px',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: 0, right: -20,
          width: 160, height: 160,
          background: '#3d6354',
          borderRadius: '0 0 0 100%',
          opacity: 0.5
        }} />
        <div style={{
          position: 'absolute', top: 20, right: 20,
          width: 90, height: 90,
          background: '#4a7a65',
          borderRadius: '50%',
          opacity: 0.3
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 28, fontWeight: 500, color: 'var(--crema)', letterSpacing: -0.5 }}>
            API Cafetería
          </div>
          <div style={{ fontSize: 13, color: 'rgba(245,240,232,0.7)', marginTop: 4 }}>
            Plataforma de pre-pedidos
          </div>
        </div>
      </div>

      <div style={{
        flex: 1, padding: '32px 24px',
        display: 'flex', flexDirection: 'column', gap: 16
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--verde-oscuro)', marginBottom: 8 }}>
            Pide sin colas,<br />recoge a tu hora.
          </div>
          <div style={{ fontSize: 14, color: 'var(--gris-texto)', lineHeight: 1.6 }}>
            Accede con tu cuenta de Google para empezar.
          </div>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={handleGoogleLogin}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: 'var(--verde-oscuro)', color: 'var(--crema)',
              borderRadius: 50, padding: '14px 20px',
              fontSize: 14, fontWeight: 500, width: '100%', border: 'none',
              cursor: 'pointer'
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>
          <p style={{ fontSize: 11, color: '#888', textAlign: 'center' }}>
            Identificación obligatoria · Sin acceso anónimo
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login