import { useNavigate } from 'react-router-dom'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'

const GOOGLE_CLIENT_ID = '381455708154-fgugflsl4ilmgn5ti0egce0nve4phcif.apps.googleusercontent.com'

function Login() {
  const navigate = useNavigate()

  const handleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: credentialResponse.credential })
      })
      const data = await res.json()
      if (data.access) {
        localStorage.setItem('token', data.access)
        localStorage.setItem('refresh', data.refresh)
        localStorage.setItem('user', JSON.stringify({
          name: data.user.first_name || data.user.email,
          email: data.user.email,
          is_staff: data.user.is_staff
        }))
        if (data.user.is_staff) {
          navigate('/admin-cafeteria')
        } else {
          navigate('/inicio')
        }
      }
    } catch (err) {
      console.error('Error en login:', err)
    }
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => console.log('Error en Google Login')}
              useOneTap
              text="continue_with"
              shape="pill"
              locale="es"
              width="300"
            />
            <p style={{ fontSize: 11, color: '#888', textAlign: 'center' }}>
              Identificación obligatoria · Sin acceso anónimo
            </p>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  )
}

export default Login