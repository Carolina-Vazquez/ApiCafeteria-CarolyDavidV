from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from .models import Categoria, Producto, FranjaHoraria, Pedido, LineaPedido
from .serializers import (
    ProductoSerializer, FranjaHorariaSerializer,
    PedidoSerializer, CrearPedidoSerializer, UserSerializer
)
from django.conf import settings


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
                username=email,
                defaults={'email': email, 'first_name': first_name, 'last_name': last_name}
            )

            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)

        except ValueError:
            return Response({'error': 'Token de Google inválido'}, status=status.HTTP_401_UNAUTHORIZED)


# ── PRODUCTOS ─────────────────────────────────────────

class ProductoListView(generics.ListAPIView):
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


class ProductoDetailView(generics.RetrieveAPIView):
    queryset = Producto.objects.filter(disponible=True)
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

class FranjaHorariaListView(generics.ListAPIView):
    queryset = FranjaHoraria.objects.filter(activa=True)
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