from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Categoria, Producto, FranjaHoraria, Pedido, LineaPedido, Alergeno, ConfiguracionCafeteria


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class AlergenoSerializer(serializers.ModelSerializer):
    nombre_display = serializers.CharField(source='get_nombre_display', read_only=True)
    
    class Meta:
        model = Alergeno
        fields = ['id', 'nombre', 'nombre_display', 'icono']

class ProductoSerializer(serializers.ModelSerializer):
    categoria = CategoriaSerializer(read_only=True)
    categoria_id = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.all(), source='categoria', write_only=True
    )

    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'descripcion', 'precio',
            'imagen', 'emoji', 'categoria', 'categoria_id',
            'disponible', 'stock'
        ]


class FranjaHorariaSerializer(serializers.ModelSerializer):
    class Meta:
        model = FranjaHoraria
        fields = '__all__'


class LineaPedidoSerializer(serializers.ModelSerializer):
    producto = ProductoSerializer(read_only=True)
    producto_id = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.all(), source='producto', write_only=True
    )
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = LineaPedido
        fields = ['id', 'producto', 'producto_id', 'cantidad', 'precio_unitario', 'subtotal']

    def get_subtotal(self, obj):
        return obj.get_subtotal()


class PedidoSerializer(serializers.ModelSerializer):
    lineas = LineaPedidoSerializer(many=True, read_only=True)
    usuario = UserSerializer(read_only=True)
    franja = FranjaHorariaSerializer(read_only=True)
    franja_id = serializers.PrimaryKeyRelatedField(
        queryset=FranjaHoraria.objects.all(), source='franja', write_only=True
    )

    class Meta:
        model = Pedido
        fields = [
            'id', 'usuario', 'franja', 'franja_id', 'estado',
            'codigo', 'total', 'pagado', 'creado_en', 'actualizado_en', 'lineas'
        ]
        read_only_fields = ['codigo', 'estado', 'pagado', 'creado_en', 'actualizado_en']


class CrearPedidoSerializer(serializers.Serializer):
    franja_id = serializers.IntegerField()
    total = serializers.DecimalField(max_digits=8, decimal_places=2)
    items = serializers.ListField(
        child=serializers.DictField()
    )

    def validate_items(self, items):
        for item in items:
            if 'producto_id' not in item or 'cantidad' not in item:
                raise serializers.ValidationError("Cada item necesita producto_id y cantidad.")
            if int(item['cantidad']) <= 0:
                raise serializers.ValidationError("La cantidad debe ser mayor que 0.")
        return items

class ConfiguracionCafeteriaSerializer(serializers.ModelSerializer):
    imagen_inicio = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = ConfiguracionCafeteria
        fields = [
            'hora_apertura', 'hora_cierre',
            'hora_corte_turno1', 'hora_inicio_recreo', 'hora_fin_recreo',
            'imagen_inicio'
        ]
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff']