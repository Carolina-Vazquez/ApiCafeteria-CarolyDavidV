import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Inicio from './pages/Inicio'
import Menu from './pages/Menu'
import Pedido from './pages/Pedido'
import Confirmacion from './pages/Confirmacion'
import Pago from './pages/Pago'
import DetalleProducto from './pages/DetalleProducto'
import MisPedidos from './pages/MisPedidos'
import Notificaciones from './pages/Notificaciones'
import AdminCafeteria from './pages/AdminCafeteria'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/inicio" element={<Inicio />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/pedido" element={<Pedido />} />
        <Route path="/pago" element={<Pago />} />
        <Route path="/confirmacion" element={<Confirmacion />} />
        <Route path="/producto/:id" element={<DetalleProducto />} />
        <Route path="/pedidos" element={<MisPedidos />} />
        <Route path="/notificaciones" element={<Notificaciones />} />
        <Route path="/admin-cafeteria" element={<AdminCafeteria />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App