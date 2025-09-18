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

    # 👀 Debug: esto lo vas a ver en la consola del servidor
    print("Categoria ID:", categoria_id)
    print("Subcategorias filtradas:", subcategorias)

    return JsonResponse({"subcategorias": subcategorias})
