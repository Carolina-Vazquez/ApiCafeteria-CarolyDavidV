from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('auth/google/', views.GoogleLoginView.as_view(), name='google-login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # Productos
    path('products/', views.ProductoListView.as_view(), name='producto-list'),
    path('products/<int:pk>/', views.ProductoDetailView.as_view(), name='producto-detail'),

    # Franjas horarias
    path('franjas/', views.FranjaHorariaListView.as_view(), name='franja-list'),

    # Pedidos
    path('orders/', views.CrearPedidoView.as_view(), name='crear-pedido'),
    path('orders/me/', views.HistorialPedidosView.as_view(), name='historial-pedidos'),
    path('orders/<int:pk>/', views.DetallePedidoView.as_view(), name='detalle-pedido'),

    # Admin
    path('admin/orders/', views.AdminPedidosView.as_view(), name='admin-pedidos'),
    path('orders/<int:pk>/status/', views.ActualizarEstadoPedidoView.as_view(), name='actualizar-estado'),
    path('inventory/<int:pk>/', views.ActualizarInventarioView.as_view(), name='actualizar-inventario'),
]