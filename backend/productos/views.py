from django.http import JsonResponse
from .models import SubCategoria


def get_subcategorias(request):
    categoria_id = request.GET.get("categoria_id")
    subcategorias = []

    if categoria_id:
        subcategorias = list(
            SubCategoria.objects.filter(categoria_id=categoria_id).values(
                "id", "nombre"
            )
        )

    return JsonResponse({"subcategorias": subcategorias})
