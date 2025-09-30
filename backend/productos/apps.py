from django.apps import AppConfig


class ProductosConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "productos"
    verbose_name = "Productos"

    def ready(self) -> None:
        """
        Importa las signals cuando la aplicación está lista.
        """
        import productos.signals  # noqa: F401
