from django.contrib import admin
from .models import Categoria, Producto, FranjaHoraria, Pedido, LineaPedido


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'emoji']


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'precio', 'categoria', 'disponible', 'stock']
    list_filter = ['categoria', 'disponible']
    search_fields = ['nombre']
    list_editable = ['disponible', 'stock']


@admin.register(FranjaHoraria)
class FranjaHorariaAdmin(admin.ModelAdmin):
    list_display = ['hora_inicio', 'hora_fin', 'activa']
    list_editable = ['activa']


class LineaPedidoInline(admin.TabularInline):
    model = LineaPedido
    extra = 0
    readonly_fields = ['precio_unitario']


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'usuario', 'estado', 'total', 'pagado', 'franja', 'creado_en']
    list_filter = ['estado', 'pagado']
    search_fields = ['codigo', 'usuario__username']
    readonly_fields = ['codigo', 'creado_en', 'actualizado_en']
    inlines = [LineaPedidoInline]