from rest_framework import generics, status, permissions, parsers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from .models import Categoria, Producto, FranjaHoraria, Pedido, LineaPedido, ConfiguracionCafeteria, Alergeno
from .serializers import (
    ProductoSerializer, FranjaHorariaSerializer,
    PedidoSerializer, CrearPedidoSerializer, UserSerializer,
    ConfiguracionCafeteriaSerializer, AlergenoSerializer,
    CategoriaSerializer
)
from django.conf import settings
from django.db.models import Sum, Avg
from django.utils import timezone
from datetime import timedelta
import os
import stripe

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')


# ── AUTH ──────────────────────────────────────────────

class GoogleLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('code')
        if not token:
            return Response({'error': 'Token requerido'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY
            )
            email = idinfo.get('email')
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email,
                    'first_name': first_name,
                    'last_name': last_name
                }
            )
            if not created:
                user.first_name = first_name
                user.last_name = last_name
                user.save()

            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)

        except ValueError:
            return Response({'error': 'Token de Google inválido'}, status=status.HTTP_401_UNAUTHORIZED)

# ── PRODUCTOS ─────────────────────────────────────────

class ProductoListView(generics.ListCreateAPIView):
    serializer_class = ProductoSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Producto.objects.filter(disponible=True)
        categoria = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        if categoria:
            queryset = queryset.filter(categoria__nombre__icontains=categoria)
        if search:
            queryset = queryset.filter(nombre__icontains=search)
        return queryset


class ProductoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    permission_classes = [permissions.AllowAny]


# ── PEDIDOS ───────────────────────────────────────────

class CrearPedidoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CrearPedidoSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            franja = FranjaHoraria.objects.get(id=data['franja_id'], activa=True)
        except FranjaHoraria.DoesNotExist:
            return Response({'error': 'Franja horaria no válida'}, status=status.HTTP_400_BAD_REQUEST)

        pedido = Pedido.objects.create(
            usuario=request.user,
            franja=franja,
            total=data['total'],
            estado='PENDIENTE_PAGO'
        )

        for item in data['items']:
            try:
                producto = Producto.objects.get(id=item['producto_id'], disponible=True)
                LineaPedido.objects.create(
                    pedido=pedido,
                    producto=producto,
                    cantidad=item['cantidad'],
                    precio_unitario=producto.precio
                )
            except Producto.DoesNotExist:
                pedido.delete()
                return Response(
                    {'error': f"Producto {item['producto_id']} no existe"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(PedidoSerializer(pedido).data, status=status.HTTP_201_CREATED)


class HistorialPedidosView(generics.ListAPIView):
    serializer_class = PedidoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Pedido.objects.filter(usuario=self.request.user)


class DetallePedidoView(generics.RetrieveAPIView):
    serializer_class = PedidoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Pedido.objects.filter(usuario=self.request.user)


# ── FRANJAS ───────────────────────────────────────────

class FranjaHorariaListView(generics.ListCreateAPIView):
    queryset = FranjaHoraria.objects.filter(activa=True)
    serializer_class = FranjaHorariaSerializer
    permission_classes = [permissions.AllowAny]


class FranjaHorariaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = FranjaHoraria.objects.all()
    serializer_class = FranjaHorariaSerializer
    permission_classes = [permissions.AllowAny]


# ── ADMIN ─────────────────────────────────────────────

class AdminPedidosView(generics.ListAPIView):
    serializer_class = PedidoSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return Pedido.objects.filter(estado__in=['PAGADO', 'PREPARANDO', 'LISTO'])


class ActualizarEstadoPedidoView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, pk):
        try:
            pedido = Pedido.objects.get(pk=pk)
        except Pedido.DoesNotExist:
            return Response({'error': 'Pedido no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        nuevo_estado = request.data.get('status')
        estados_validos = ['PREPARANDO', 'LISTO', 'ENTREGADO']

        if nuevo_estado not in estados_validos:
            return Response({'error': 'Estado no válido'}, status=status.HTTP_400_BAD_REQUEST)

        if not pedido.pagado:
            return Response({'error': 'El pedido no está pagado'}, status=status.HTTP_409_CONFLICT)

        pedido.estado = nuevo_estado
        pedido.save()
        return Response(PedidoSerializer(pedido).data, status=status.HTTP_200_OK)


class ActualizarInventarioView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, pk):
        try:
            producto = Producto.objects.get(pk=pk)
        except Producto.DoesNotExist:
            return Response({'error': 'Producto no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        stock = request.data.get('stock')
        disponible = request.data.get('disponible')

        if stock is not None:
            producto.stock = stock
        if disponible is not None:
            producto.disponible = disponible

        producto.save()
        return Response(ProductoSerializer(producto).data, status=status.HTTP_200_OK)


class ConfiguracionCafeteriaView(APIView):
    permission_classes = [permissions.AllowAny]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get(self, request):
        config = ConfiguracionCafeteria.get()
        serializer = ConfiguracionCafeteriaSerializer(config, context={'request': request})
        return Response(serializer.data)

    def put(self, request):
        config = ConfiguracionCafeteria.get()
        serializer = ConfiguracionCafeteriaSerializer(
            config, data=request.data, partial=True, context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class CategoriaListCreateView(generics.ListCreateAPIView):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.AllowAny]


class CategoriaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.AllowAny]


class AlergenoListView(generics.ListAPIView):
    queryset = Alergeno.objects.all()
    serializer_class = AlergenoSerializer
    permission_classes = [permissions.AllowAny]


class AdminStatsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        hoy = timezone.now().date()
        inicio_semana = hoy - timedelta(days=hoy.weekday())

        pedidos_hoy = Pedido.objects.filter(creado_en__date=hoy, pagado=True)
        ingresos_hoy = pedidos_hoy.aggregate(total=Sum('total'))['total'] or 0
        en_preparacion = Pedido.objects.filter(estado='PAGADO').count()
        ticket_medio = pedidos_hoy.aggregate(media=Avg('total'))['media'] or 0

        pedidos_semana = []
        dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie']
        for i in range(5):
            dia = inicio_semana + timedelta(days=i)
            pedidos_dia = Pedido.objects.filter(creado_en__date=dia, pagado=True)
            ingresos_dia = pedidos_dia.aggregate(total=Sum('total'))['total'] or 0
            pedidos_semana.append({
                'dia': dias[i],
                'pedidos': pedidos_dia.count(),
                'ingresos': round(float(ingresos_dia), 2),
                'esHoy': dia == hoy
            })

        top_productos = LineaPedido.objects.filter(
            pedido__pagado=True
        ).values(
            'producto__id', 'producto__nombre', 'producto__emoji', 'producto__imagen'
        ).annotate(total_vendido=Sum('cantidad')).order_by('-total_vendido')[:5]

        return Response({
            'pedidos_hoy': pedidos_hoy.count(),
            'ingresos_hoy': round(float(ingresos_hoy), 2),
            'en_preparacion': en_preparacion,
            'ticket_medio': round(float(ticket_medio), 2),
            'pedidos_semana': pedidos_semana,
            'top_productos': list(top_productos)
        })


class CreatePaymentIntentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        amount = int(float(request.data.get('amount', 0)) * 100)
        pedido_id = request.data.get('pedido_id')
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='eur',
            metadata={'pedido_id': pedido_id}
        )
        return Response({'client_secret': intent.client_secret})


class StripeWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, os.getenv('STRIPE_WEBHOOK_SECRET', '')
            )
        except Exception:
            return Response(status=400)

        if event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            try:
                pedido_id = payment_intent['metadata']['pedido_id']
            except (KeyError, TypeError):
                pedido_id = None
            if pedido_id:
                try:
                    pedido = Pedido.objects.get(id=pedido_id)
                    pedido.pagado = True
                    pedido.estado = 'PAGADO'
                    pedido.save()
                except Pedido.DoesNotExist:
                    pass

        return Response({'status': 'ok'})