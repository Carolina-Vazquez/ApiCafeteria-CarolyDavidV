from django.db import models
from django.contrib.auth.models import User
import random
import string


class Categoria(models.Model):
    nombre = models.CharField(max_length=100)
    emoji = models.CharField(max_length=10, blank=True)

    class Meta:
        verbose_name_plural = 'Categorias'

    def __str__(self):
        return self.nombre
class Alergeno(models.Model):
    ALERGENOS_CHOICES = [
        ('gluten', 'Gluten'),
        ('crustaceos', 'Crustáceos'),
        ('huevos', 'Huevos'),
        ('pescado', 'Pescado'),
        ('cacahuetes', 'Cacahuetes'),
        ('soja', 'Soja'),
        ('leche', 'Leche'),
        ('frutos_cascara', 'Frutos de cáscara'),
        ('apio', 'Apio'),
        ('mostaza', 'Mostaza'),
        ('sesamo', 'Sésamo'),
        ('dioxido_azufre', 'Dióxido de azufre'),
        ('altramuces', 'Altramuces'),
        ('moluscos', 'Moluscos'),
    ]

    nombre = models.CharField(max_length=50, choices=ALERGENOS_CHOICES, unique=True)

    def __str__(self):
        return self.get_nombre_display()

    class Meta:
        verbose_name_plural = 'Alérgenos'

class Producto(models.Model):
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    precio = models.DecimalField(max_digits=6, decimal_places=2)
    imagen = models.ImageField(upload_to='productos/', blank=True, null=True)
    emoji = models.CharField(max_length=10, blank=True)
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True)
    disponible = models.BooleanField(default=True)
    stock = models.PositiveIntegerField(default=0)
    alergenos = models.ManyToManyField(Alergeno, blank=True)

    def __str__(self):
        return self.nombre
    
class FranjaHoraria(models.Model):
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    activa = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Franjas horarias'

    def __str__(self):
        return f"{self.hora_inicio} - {self.hora_fin}"


class Pedido(models.Model):
    ESTADOS = [
        ('PENDIENTE_PAGO', 'Pendiente de pago'),
        ('PAGADO', 'Pagado'),
        ('PREPARANDO', 'Preparando'),
        ('LISTO', 'Listo para recoger'),
        ('ENTREGADO', 'Entregado'),
        ('CANCELADO', 'Cancelado'),
    ]

    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pedidos')
    franja = models.ForeignKey(FranjaHoraria, on_delete=models.SET_NULL, null=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='PENDIENTE_PAGO')
    codigo = models.CharField(max_length=10, unique=True, blank=True)
    total = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    pagado = models.BooleanField(default=False)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.codigo:
            self.codigo = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-creado_en']

    def __str__(self):
        return f"Pedido {self.codigo} - {self.usuario.username} - {self.estado}"


class LineaPedido(models.Model):
    pedido = models.ForeignKey(Pedido, related_name='lineas', on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=6, decimal_places=2)

    def get_subtotal(self):
        return self.cantidad * self.precio_unitario

    def __str__(self):
        return f"{self.cantidad}x {self.producto.nombre} (Pedido {self.pedido.codigo})"
class ConfiguracionCafeteria(models.Model):
    hora_apertura = models.TimeField(default='08:45')
    hora_cierre = models.TimeField(default='14:30')
    hora_corte_turno1 = models.TimeField(default='10:30')
    hora_inicio_recreo = models.TimeField(default='11:15')
    hora_fin_recreo = models.TimeField(default='11:45')
    imagen_inicio = models.ImageField(upload_to='cafeteria/', blank=True, null=True)
    
    class Meta:
        verbose_name = 'Configuración de la cafetería'
        verbose_name_plural = 'Configuración de la cafetería'

    def __str__(self):
        return 'Configuración de la cafetería'

    def save(self, *args, **kwargs):
        # Solo puede existir una configuración
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj