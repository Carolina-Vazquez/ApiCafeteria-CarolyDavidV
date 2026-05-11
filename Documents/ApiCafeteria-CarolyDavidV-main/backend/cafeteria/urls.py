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

    # Pagos
    path('payments/create-intent/', views.CreatePaymentIntentView.as_view(), name='create-payment-intent'),

    # Admin
    path('admin/orders/', views.AdminPedidosView.as_view(), name='admin-pedidos'),
    path('orders/<int:pk>/status/', views.ActualizarEstadoPedidoView.as_view(), name='actualizar-estado'),
    path('inventory/<int:pk>/', views.ActualizarInventarioView.as_view(), name='actualizar-inventario'),
    path('config/', views.ConfiguracionCafeteriaView.as_view(), name='configuracion'),
    path('products/<int:pk>/', views.ProductoDetailUpdateView.as_view(), name='producto-detail-update'),
    path('categorias/', views.CategoriaListCreateView.as_view(), name='categoria-list-create'),
    path('alergenos/', views.AlergenoListView.as_view(), name='alergeno-list'),
    path('categorias/<int:pk>/', views.CategoriaDetailView.as_view(), name='categoria-detail'),
    path('admin/stats/', views.AdminStatsView.as_view(), name='admin-stats'),
]