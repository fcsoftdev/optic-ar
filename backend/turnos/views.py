"""
Vistas para el sistema de calendario de turnos simplificado.

Implementa un calendario interactivo estilo Google Calendar
con funcionalidades básicas de CRUD para turnos.
"""

from django.shortcuts import render, get_object_or_404
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import View, TemplateView
from django.http import JsonResponse, HttpResponse
from django.db.models import Q
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.template.loader import render_to_string
from datetime import datetime, date, timedelta
import json
import calendar
from xhtml2pdf import pisa

from .models import Turno, ConfiguracionCalendario
from ventas.models import Cliente


class CalendarioView(LoginRequiredMixin, TemplateView):
    """Vista principal del calendario de turnos."""

    template_name = "turnos/calendario.html"

    def get_context_data(self, **kwargs):
        """Prepara el contexto para la vista del calendario."""
        context = super().get_context_data(**kwargs)

        # Obtener fecha actual o la especificada
        hoy = timezone.now().date()
        year = int(self.request.GET.get("year", hoy.year))
        month = int(self.request.GET.get("month", hoy.month))

        # Crear objeto de fecha para el mes actual
        fecha_mes = date(year, month, 1)

        # Calcular navegación de meses
        mes_anterior = fecha_mes - timedelta(days=1)
        mes_anterior = mes_anterior.replace(day=1)

        try:
            mes_siguiente = fecha_mes.replace(month=month + 1)
        except ValueError:
            mes_siguiente = fecha_mes.replace(year=year + 1, month=1)

        # Obtener configuración del calendario
        configuracion = ConfiguracionCalendario.get_configuracion_activa()

        # Generar calendario del mes
        cal = calendar.monthcalendar(year, month)

        # Obtener turnos del mes
        primer_dia = fecha_mes
        ultimo_dia = (
            fecha_mes.replace(month=month % 12 + 1, day=1) - timedelta(days=1)
            if month < 12
            else fecha_mes.replace(year=year + 1, month=1, day=1) - timedelta(days=1)
        )

        turnos_mes = (
            Turno.objects.filter(fecha__range=[primer_dia, ultimo_dia])
            .select_related("cliente")
            .order_by("fecha", "hora_inicio")
        )

        # Organizar turnos por fecha
        turnos_por_fecha = {}
        for turno in turnos_mes:
            fecha_str = turno.fecha.strftime("%Y-%m-%d")
            if fecha_str not in turnos_por_fecha:
                turnos_por_fecha[fecha_str] = []
            turnos_por_fecha[fecha_str].append(
                {
                    "id": turno.id,
                    "cliente": turno.cliente.nombre_apellido,
                    "hora_inicio": turno.hora_inicio.strftime("%H:%M"),
                    "hora_fin": (
                        turno.hora_fin.strftime("%H:%M") if turno.hora_fin else ""
                    ),
                    "motivo": (
                        turno.motivo[:30] + "..."
                        if turno.motivo and len(turno.motivo) > 30
                        else turno.motivo or ""
                    ),
                }
            )

        context.update(
            {
                "fecha_actual": fecha_mes,
                "year": year,
                "month": month,
                "mes_nombre": calendar.month_name[month],
                "mes_anterior": mes_anterior,
                "mes_siguiente": mes_siguiente,
                "calendario": cal,
                "turnos_por_fecha": turnos_por_fecha,
                "configuracion": configuracion,
                "hoy": hoy,
            }
        )

        return context


class BuscarClientesAPI(LoginRequiredMixin, View):
    """API para buscar clientes existentes."""

    def get(self, request):
        """Busca clientes según el término proporcionado."""
        query = request.GET.get("q", "").strip()

        if len(query) < 2:
            return JsonResponse({"clientes": []})

        clientes = Cliente.objects.filter(
            Q(nombre_apellido__icontains=query)
            | Q(dni__icontains=query)
            | Q(telefono__icontains=query)
        )[:10]

        clientes_data = []
        for cliente in clientes:
            clientes_data.append(
                {
                    "id": cliente.id,
                    "nombre_apellido": cliente.nombre_apellido,
                    "dni": cliente.dni,
                    "telefono": cliente.telefono or "No especificado",
                    "direccion": cliente.direccion or "No especificada",
                }
            )

        return JsonResponse({"clientes": clientes_data})


@method_decorator(csrf_exempt, name="dispatch")
class CrearTurnoAPI(LoginRequiredMixin, View):
    """API para crear nuevos turnos."""

    def post(self, request):
        """Crea un nuevo turno."""
        try:
            data = json.loads(request.body)

            # Validar datos requeridos
            campos_requeridos = ["cliente_id", "fecha", "hora_inicio"]
            for campo in campos_requeridos:
                if campo not in data:
                    return JsonResponse(
                        {"error": f"Campo requerido: {campo}"}, status=400
                    )

            # Obtener cliente
            try:
                cliente = Cliente.objects.get(id=data["cliente_id"])
            except Cliente.DoesNotExist:
                return JsonResponse({"error": "Cliente no encontrado"}, status=400)

            # Parsear fecha y hora
            try:
                fecha = datetime.strptime(data["fecha"], "%Y-%m-%d").date()
                hora_inicio = datetime.strptime(data["hora_inicio"], "%H:%M").time()
            except ValueError as e:
                return JsonResponse(
                    {"error": f"Formato de fecha/hora inválido: {e}"}, status=400
                )

            # Crear turno
            turno = Turno(
                cliente=cliente,
                fecha=fecha,
                hora_inicio=hora_inicio,
                motivo=data.get("motivo", ""),
                created_by=request.user,
            )

            turno.save()

            return JsonResponse(
                {
                    "success": True,
                    "turno": {
                        "id": turno.id,
                        "cliente": turno.cliente.nombre_apellido,
                        "fecha": turno.fecha.strftime("%Y-%m-%d"),
                        "hora_inicio": turno.hora_inicio.strftime("%H:%M"),
                        "hora_fin": (
                            turno.hora_fin.strftime("%H:%M") if turno.hora_fin else ""
                        ),
                        "motivo": turno.motivo,
                    },
                }
            )

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@method_decorator(csrf_exempt, name="dispatch")
class ActualizarTurnoAPI(LoginRequiredMixin, View):
    """API para actualizar turnos existentes."""

    def post(self, request):
        """Actualiza un turno existente."""
        try:
            data = json.loads(request.body)

            if "turno_id" not in data:
                return JsonResponse({"error": "ID del turno requerido"}, status=400)

            turno = get_object_or_404(Turno, id=data["turno_id"])

            # Actualizar campos si están presentes
            if "motivo" in data:
                turno.motivo = data["motivo"]

            if "observaciones" in data:
                turno.observaciones = data["observaciones"]

            if "fecha" in data and "hora_inicio" in data:
                try:
                    turno.fecha = datetime.strptime(data["fecha"], "%Y-%m-%d").date()
                    turno.hora_inicio = datetime.strptime(
                        data["hora_inicio"], "%H:%M"
                    ).time()
                    # Limpiar hora_fin para que se recalcule
                    turno.hora_fin = None
                except ValueError as e:
                    return JsonResponse(
                        {"error": f"Formato de fecha/hora inválido: {e}"}, status=400
                    )

            turno.save()

            return JsonResponse(
                {
                    "success": True,
                    "turno": {
                        "id": turno.id,
                        "cliente": turno.cliente.nombre_apellido,
                        "fecha": turno.fecha.strftime("%Y-%m-%d"),
                        "hora_inicio": turno.hora_inicio.strftime("%H:%M"),
                        "hora_fin": (
                            turno.hora_fin.strftime("%H:%M") if turno.hora_fin else ""
                        ),
                        "motivo": turno.motivo,
                        "observaciones": turno.observaciones,
                    },
                }
            )

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@method_decorator(csrf_exempt, name="dispatch")
class EliminarTurnoAPI(LoginRequiredMixin, View):
    """API para eliminar turnos."""

    def delete(self, request, turno_id):
        """Elimina un turno específico."""
        try:
            turno = get_object_or_404(Turno, id=turno_id)
            turno.delete()

            return JsonResponse(
                {"success": True, "message": "Turno eliminado exitosamente"}
            )

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


class ObtenerTurnoAPI(LoginRequiredMixin, View):
    """API para obtener los datos de un turno específico."""

    def get(self, request, turno_id):
        """Obtiene los datos completos de un turno."""
        try:
            turno = get_object_or_404(Turno, id=turno_id)

            turno_data = {
                "id": turno.id,
                "fecha": turno.fecha.strftime("%Y-%m-%d"),
                "hora_inicio": turno.hora_inicio.strftime("%H:%M"),
                "hora_fin": turno.hora_fin.strftime("%H:%M") if turno.hora_fin else "",
                "motivo": turno.motivo,
                "observaciones": turno.observaciones,
                "cliente_id": turno.cliente.id,
                "cliente": {
                    "id": turno.cliente.id,
                    "nombre_apellido": turno.cliente.nombre_apellido,
                    "dni": turno.cliente.dni,
                    "telefono": turno.cliente.telefono,
                },
                "puede_editar": turno.puede_editar,
            }

            return JsonResponse(turno_data)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


class TurnosFechaAPI(LoginRequiredMixin, View):
    """API para obtener turnos de una fecha específica."""

    def get(self, request):
        """Obtiene los turnos para una fecha específica."""
        fecha_str = request.GET.get("fecha")
        if not fecha_str:
            return JsonResponse({"error": "Fecha requerida"}, status=400)

        try:
            fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
        except ValueError:
            return JsonResponse({"error": "Formato de fecha inválido"}, status=400)

        turnos = (
            Turno.objects.filter(fecha=fecha)
            .select_related("cliente")
            .order_by("hora_inicio")
        )

        turnos_data = []
        for turno in turnos:
            turnos_data.append(
                {
                    "id": turno.id,
                    "cliente": {
                        "id": turno.cliente.id,
                        "nombre_apellido": turno.cliente.nombre_apellido,
                        "dni": turno.cliente.dni,
                        "telefono": turno.cliente.telefono or "",
                    },
                    "fecha": turno.fecha.strftime("%Y-%m-%d"),
                    "hora_inicio": turno.hora_inicio.strftime("%H:%M"),
                    "hora_fin": (
                        turno.hora_fin.strftime("%H:%M") if turno.hora_fin else ""
                    ),
                    "motivo": turno.motivo or "",
                    "observaciones": turno.observaciones or "",
                    "puede_editar": turno.puede_editar,
                }
            )

        return JsonResponse({"turnos": turnos_data})


def link_callback(uri, rel):
    """
    Convierte las URI de HTML (como /static/...) a rutas absolutas del sistema
    para que xhtml2pdf pueda acceder a ellas.
    """
    import os
    from django.conf import settings

    if uri.startswith(settings.MEDIA_URL):
        path = os.path.join(settings.MEDIA_ROOT, uri.replace(settings.MEDIA_URL, ""))
    elif uri.startswith(settings.STATIC_URL):
        path = os.path.join(settings.STATIC_ROOT, uri.replace(settings.STATIC_URL, ""))
    else:
        return uri

    if not os.path.isfile(path):
        raise Exception(
            f"media URI must start with {settings.STATIC_URL} or {settings.MEDIA_URL}"
        )
    return path


class GenerarTurnoPDFView(LoginRequiredMixin, View):
    """Vista para generar PDF de un turno específico."""

    def get(self, request, turno_id):
        """Genera y retorna un PDF con los datos del turno."""
        try:
            turno = get_object_or_404(Turno, id=turno_id)

            # Renderizar el template HTML
            from django.conf import settings

            html = render_to_string(
                "turnos/turno_pdf.html",
                {
                    "turno": turno,
                    "cliente": turno.cliente,
                    "STATIC_URL": settings.STATIC_URL,
                    "STATIC_ROOT": settings.STATIC_ROOT,
                },
            )

            # Crear respuesta HTTP para PDF
            response = HttpResponse(content_type="application/pdf")
            response["Content-Disposition"] = (
                f'attachment; filename="Turno - {turno.cliente.nombre_apellido}.pdf"'
            )

            # Generar PDF con xhtml2pdf
            pisa_status = pisa.CreatePDF(
                src=html, dest=response, link_callback=link_callback
            )

            if pisa_status.err:
                return JsonResponse({"error": "Error al generar PDF"}, status=500)

            return response

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
