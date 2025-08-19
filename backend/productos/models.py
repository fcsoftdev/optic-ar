from django.db import models

class Marca(models.Model):
    """Model para registrar las Marcas."""

    nombre = models.CharField(max_length=100)

    def __str__(self):
        """Unicode representation of Marca."""
        return f"{self.nombre}"

class Categoria(models.Model):
    """Modelo para registrar las Categorias."""
    nombre = models.CharField(max_length=50)
    
    def __str__(self):
        return self.nombre
    
class SubCategoria(models.Model):
    categoria = models.ForeignKey(Categoria, null=True, on_delete=models.SET_NULL, related_name='sub_categorias')
    nombre = models.CharField(max_length=50)
    
    class Meta:
        verbose_name = "Sub Categoria"
        verbose_name_plural = "Sub Categorias"

    def __str__(self):
        return f"{self.categoria} - {self.nombre}"

class Producto(models.Model):
    """Modelo para el registro de Productos."""
    codigo = models.CharField(max_length=50)
    nombre = models.CharField(max_length=50)
    descripcion = models.TextField()
    marca = models.ForeignKey(Marca, null=True ,on_delete=models.SET_NULL)
    categoria = models.ForeignKey(Categoria, null=True, on_delete=models.SET_NULL, blank=True)
    sub_categoria = models.ForeignKey(SubCategoria, null=True, on_delete=models.SET_NULL, blank=True)
    stock = models.PositiveIntegerField()
    precio_costo = models.DecimalField("Precio de costo", max_digits=10, decimal_places=2)
    precio_venta = models.DecimalField("Precio de venta", max_digits=10, decimal_places=2, null=True)

    def __str__(self):
        return f"{self.codigo}-{self.nombre}"