"""
Vistas de autenticación JWT personalizadas.

Implementa:
- Login con access token en cuerpo + refresh token en cookie HttpOnly
- Refresh silencioso leyendo la cookie
- Logout con blacklist del refresh token
"""

from typing import Any

from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
    TokenRefreshSerializer,
)
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

from .serializers import PerfilSerializer

User = get_user_model()

# Nombre de la cookie que almacena el refresh token
REFRESH_COOKIE_NAME = "refresh_token"
# Duración de la cookie: 1 día en segundos
REFRESH_COOKIE_AGE = 24 * 60 * 60


def _serializar_usuario(user: Any) -> dict:
    """
    Serializa los datos esenciales del usuario autenticado para el frontend.

    Args:
        user: Instancia del modelo User de Django.

    Returns:
        Diccionario con id, username, email, grupos y permisos del usuario.
    """
    return {
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "groups": list(user.groups.values_list("name", flat=True)),
        "permissions": list(user.get_all_permissions()),
    }


def _establecer_cookie_refresh(response: Response, refresh_token: str) -> None:
    """
    Establece la cookie HttpOnly con el refresh token en la respuesta.

    El atributo Secure se activa solo en producción (cuando DEBUG=False).

    Args:
        response: Objeto Response de DRF donde se establece la cookie.
        refresh_token: Cadena del refresh token JWT.
    """
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="Lax",
        max_age=REFRESH_COOKIE_AGE,
        path="/",
    )


class LoginView(APIView):
    """
    Vista de login que devuelve access token + datos del usuario.

    El refresh token se establece como cookie HttpOnly, nunca en el cuerpo
    de la respuesta, para protegerlo contra XSS.

    POST /api/token/
    Body: { "username": "...", "password": "..." }
    Response: { "access": "...", "user": { id, username, email, groups, permissions } }
    Set-Cookie: refresh_token=...; HttpOnly; SameSite=Strict
    """

    permission_classes = [AllowAny]

    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Autentica al usuario y emite los tokens JWT."""
        serializer = TokenObtainPairSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as exc:
            raise InvalidToken(exc.args[0]) from exc

        access = str(serializer.validated_data["access"])
        refresh = str(serializer.validated_data["refresh"])
        user = serializer.user

        response = Response(
            {
                "access": access,
                "user": _serializar_usuario(user),
            },
            status=status.HTTP_200_OK,
        )
        _establecer_cookie_refresh(response, refresh)
        return response


class RefreshView(APIView):
    """
    Vista de refresh que lee el refresh token desde la cookie HttpOnly.

    Rota el refresh token (ROTATE_REFRESH_TOKENS=True) y devuelve un nuevo
    access token junto con los datos actualizados del usuario.

    POST /api/token/refresh/
    Cookie: refresh_token=...
    Response: { "access": "...", "user": { ... } }
    Set-Cookie: refresh_token=...; HttpOnly; SameSite=Strict  (token rotado)
    """

    permission_classes = [AllowAny]

    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Renueva el access token usando la cookie de refresh."""
        refresh_token = request.COOKIES.get(REFRESH_COOKIE_NAME)

        if not refresh_token:
            return Response(
                {"detail": "Refresh token no encontrado."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = TokenRefreshSerializer(data={"refresh": refresh_token})

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError:
            return Response(
                {"detail": "Sesión expirada. Inicie sesión nuevamente."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        access = serializer.validated_data["access"]
        new_refresh = serializer.validated_data.get("refresh")

        # Obtener datos del usuario desde el nuevo access token
        decoded_access = AccessToken(access)
        user = User.objects.get(id=decoded_access["user_id"])

        response = Response(
            {
                "access": access,
                "user": _serializar_usuario(user),
            },
            status=status.HTTP_200_OK,
        )

        if new_refresh:
            _establecer_cookie_refresh(response, new_refresh)

        return response


class LogoutView(APIView):
    """
    Vista de logout que invalida el refresh token y limpia la cookie.

    Blacklistea el refresh token para que no pueda reutilizarse, incluso
    si la cookie fue interceptada.

    POST /api/token/logout/
    Cookie: refresh_token=...
    Response: { "detail": "Sesión cerrada exitosamente." }
    """

    permission_classes = [AllowAny]

    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Cierra la sesión del usuario e invalida el refresh token."""
        refresh_token = request.COOKIES.get(REFRESH_COOKIE_NAME)

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                # Token ya inválido o expirado; se procede igual con el logout
                pass

        response = Response(
            {"detail": "Sesión cerrada exitosamente."},
            status=status.HTTP_200_OK,
        )
        response.delete_cookie(
            key=REFRESH_COOKIE_NAME,
            path="/",
            samesite="Lax",
        )
        return response


class PerfilView(APIView):
    """
    Vista de perfil del usuario autenticado.

    Permite al usuario consultar y actualizar sus propios datos básicos
    (first_name, last_name, email). No expone datos de otros usuarios.

    GET  /api/perfil/  → datos actuales del usuario
    PATCH /api/perfil/ → actualiza first_name, last_name o email
    """

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        """Devuelve los datos del perfil del usuario autenticado."""
        serializer = PerfilSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request: Request) -> Response:
        """
        Actualiza parcialmente el perfil del usuario autenticado.

        Args:
            request: Petición con los campos a modificar (partial=True).

        Returns:
            Datos actualizados del usuario junto con el payload de usuario
            completo (para que el frontend actualice el store).
        """
        serializer = PerfilSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Refresca el usuario desde la base de datos para leer datos actualizados
        request.user.refresh_from_db()

        return Response(
            {
                "perfil": serializer.data,
                "user": _serializar_usuario(request.user),
            },
            status=status.HTTP_200_OK,
        )
