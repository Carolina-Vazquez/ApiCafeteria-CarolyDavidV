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
    path('franjas/<int:pk>/', views.FranjaHorariaDetailView.as_view(), name='franja-detail'),

    # Pedidos
    path('orders/', views.CrearPedidoView.as_view(), name='crear-pedido'),
    path('orders/me/', views.HistorialPedidosView.as_view(), name='historial-pedidos'),
    path('orders/<int:pk>/', views.DetallePedidoView.as_view(), name='detalle-pedido'),
    path('orders/<int:pk>/status/', views.ActualizarEstadoPedidoView.as_view(), name='actualizar-estado'),

    # Pagos
    path('payments/create-intent/', views.CreatePaymentIntentView.as_view(), name='create-payment-intent'),
    path('payments/webhook/', views.StripeWebhookView.as_view(), name='stripe-webhook'),

    # Admin
    path('admin/orders/', views.AdminPedidosView.as_view(), name='admin-pedidos'),
    path('admin/stats/', views.AdminStatsView.as_view(), name='admin-stats'),
    path('inventory/<int:pk>/', views.ActualizarInventarioView.as_view(), name='actualizar-inventario'),

    # Config y catálogo
    path('config/', views.ConfiguracionCafeteriaView.as_view(), name='configuracion'),
    path('categorias/', views.CategoriaListCreateView.as_view(), name='categoria-list-create'),
    path('categorias/<int:pk>/', views.CategoriaDetailView.as_view(), name='categoria-detail'),
    path('alergenos/', views.AlergenoListView.as_view(), name='alergeno-list'),
]