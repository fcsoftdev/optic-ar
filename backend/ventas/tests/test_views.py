from decimal import Decimal
from django.test import TestCase, Client
from django.urls import reverse
from django.conf import settings
from django.contrib.staticfiles import finders
import json
import os
from unittest.mock import patch

from ventas.views import link_callback


class TestLinkCallback(TestCase):
    """Tests para la función link_callback"""

    def test_static_url_found(self):
        """Test link_callback con archivo estático existente"""
        # Usar un archivo estático que sabemos que existe
        uri = settings.STATIC_URL + "images/logo.png"
        result = link_callback(uri, None)
        self.assertTrue(os.path.exists(result))

    @patch("django.conf.settings.DEBUG", True)
    def test_static_url_not_found_debug(self):
        """Test link_callback con archivo estático inexistente en modo DEBUG"""
        uri = settings.STATIC_URL + "no_existe.png"
        result = link_callback(uri, None)
        self.assertEqual(result, uri)  # Debería devolver la URI original

    def test_media_url_with_file(self):
        """Test link_callback con archivo media existente"""
        # Configurar MEDIA_ROOT temporal para el test
        import tempfile

        with tempfile.TemporaryDirectory() as temp_dir:
            with self.settings(MEDIA_ROOT=temp_dir):
                # Crear un archivo temporal en MEDIA_ROOT
                media_file = "test.txt"
                media_path = os.path.join(temp_dir, media_file)
                with open(media_path, "w") as f:
                    f.write("test")

                uri = settings.MEDIA_URL + media_file
                result = link_callback(uri, None)
                self.assertEqual(result, media_path)

    def test_other_url(self):
        """Test link_callback con URL que no es static ni media"""
        uri = "http://ejemplo.com/imagen.png"
        result = link_callback(uri, None)
        self.assertEqual(result, uri)  # Debería devolver la URI original


class TestGenerarPresupuestoPDFView(TestCase):
    """Tests para la vista GenerarPresupuestoPDFView"""

    def setUp(self):
        self.client = Client()
        self.url = reverse("generar_presupuesto_pdf")
        self.data = {
            "cliente": {
                "nombre": "Juan Pérez",
                "dni": "12345678",
            },
            "items": [
                {
                    "producto": "Armazón",
                    "cantidad": 1,
                    "precio": "1000.00",
                }
            ],
            "total": "1000.00",
        }

    @patch("ventas.views.pisa.CreatePDF")
    def test_generar_pdf_exitoso(self, mock_create_pdf):
        """Test generación exitosa de PDF"""
        # Configurar el mock para simular éxito
        mock_create_pdf.return_value.err = False

        response = self.client.post(
            self.url, data=json.dumps(self.data), content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertEqual(
            response["Content-Disposition"], 'attachment; filename="presupuesto.pdf"'
        )

    @patch("ventas.views.pisa.CreatePDF")
    def test_generar_pdf_error(self, mock_create_pdf):
        """Test error en generación de PDF"""
        # Configurar el mock para simular error
        mock_create_pdf.return_value.err = True

        response = self.client.post(
            self.url, data=json.dumps(self.data), content_type="application/json"
        )

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.content.decode(), "Error al generar PDF")

    def test_metodo_no_permitido(self):
        """Test método GET no permitido"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 405)  # Method Not Allowed
