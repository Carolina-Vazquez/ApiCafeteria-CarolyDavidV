import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe('pk_test_51TVzylI8Tx1JIyMTsFt0eAkMySzEYGiCHWJaOqOFyVZw9mFD0SC9ZrKo8Oq0y1SnLLEqSRK9zam1VHHVDr9AuW0m00mhrbs53w')

function CheckoutForm({ pedido, total, franja }) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')

      // 1. Crear pedido en el backend
      const resPedido = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          franja_id: franja.id,
          total: total,
          items: pedido.map(p => ({ producto_id: p.id, cantidad: p.cantidad }))
        })
      })
      const pedidoData = await resPedido.json()
      if (!resPedido.ok) throw new Error('Error creando pedido')

      // 2. Crear PaymentIntent en el backend
      const resIntent = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/create-intent/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: total, pedido_id: pedidoData.id })
      })
      const { client_secret } = await resIntent.json()

      // 3. Confirmar pago con Stripe
      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: { card: elements.getElement(CardElement) }
      })

      if (result.error) {
        setError(result.error.message)
        setLoading(false)
        return
      }

      // 4. Pago exitoso → guardar y navegar a confirmación
      localStorage.setItem('pedido', JSON.stringify({
        ...pedidoData,
        carrito: pedido,
        franja: franja,
        total: total
      }))
      localStorage.removeItem('carrito')
      navigate('/confirmacion')

    } catch (err) {
      setError('Error procesando el pago. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        background: 'white', borderRadius: 12,
        padding: '16px', border: '1.5px solid #ddd'
      }}>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>Datos de la tarjeta</div>
        <CardElement options={{
          style: {
            base: { fontSize: '14px', color: '#2a2a28', '::placeholder': { color: '#aaa' } }
          }
        }} />
      </div>

      {error && (
        <div style={{ background: '#fff0f0', border: '1px solid #ffcdd2', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#c62828' }}>
          {error}
        </div>
      )}

      <div style={{ fontSize: 12, color: '#888', textAlign: 'center' }}>
        🔒 Tarjeta de prueba: 4242 4242 4242 4242 · Cualquier fecha y CVC
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        style={{
          width: '100%',
          background: loading ? '#ccc' : '#4CAF82',
          color: 'white', border: 'none',
          borderRadius: 50, padding: '15px',
          fontSize: 15, fontWeight: 500,
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Procesando...' : `Pagar ${Number(total).toFixed(2)}€`}
      </button>
    </form>
  )
}

function Pago() {
  const navigate = useNavigate()
  const [datosPedido, setDatosPedido] = useState(null)

  useEffect(() => {
    const pedidoGuardado = JSON.parse(localStorage.getItem('pedido') || 'null')
    if (!pedidoGuardado || !pedidoGuardado.franja) {
      navigate('/menu')
      return
    }
    setDatosPedido(pedidoGuardado)
  }, [])

  if (!datosPedido) return null

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--crema)' }}>
      <div style={{ background: 'var(--verde-oscuro)', padding: '16px 16px 24px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: 'rgba(245,240,232,0.8)', fontSize: 20, cursor: 'pointer', marginBottom: 8, display: 'block' }}
        >←</button>
        <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--crema)' }}>Pago seguro</div>
        <div style={{ fontSize: 13, color: 'rgba(245,240,232,0.7)', marginTop: 2 }}>
          Recogida: {datosPedido.franja.hora_inicio?.slice(0, 5)} – {datosPedido.franja.hora_fin?.slice(0, 5)}
        </div>
      </div>

      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: '14px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#666', marginBottom: 10 }}>Resumen del pedido</div>
          {datosPedido.carrito?.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
              <span>{item.emoji} {item.nombre} x{item.cantidad}</span>
              <span style={{ color: 'var(--verde-oscuro)', fontWeight: 500 }}>{(item.precio * item.cantidad).toFixed(2)}€</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #eee', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
            <span>Total</span>
            <span style={{ color: 'var(--verde-oscuro)' }}>{Number(datosPedido.total).toFixed(2)}€</span>
          </div>
        </div>

        <Elements stripe={stripePromise}>
          <CheckoutForm
            pedido={datosPedido.carrito}
            total={datosPedido.total}
            franja={datosPedido.franja}
          />
        </Elements>
      </div>
    </div>
  )
}

export default Pago