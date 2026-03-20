/**
 * Hooks de React Query para el ABM de Usuarios, Grupos y Permisos.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createGrupo,
  createUsuario,
  deleteGrupo,
  deleteUsuario,
  getGrupo,
  getGrupos,
  getPermisos,
  getUsuario,
  getUsuarios,
  updateGrupo,
  updateUsuario,
} from "../services/users.service";
import type { GrupoPayload, UsuarioPayload } from "../services/users.service";

const KEYS = {
  usuarios: ["usuarios"] as const,
  usuario: (id: number) => ["usuarios", id] as const,
  grupos: ["grupos"] as const,
  grupo: (id: number) => ["grupos", id] as const,
  permisos: ["permisos"] as const,
};

// ── Usuarios ──────────────────────────────────────────────────────────────────

export function useUsuarios(search = "") {
  return useQuery({
    queryKey: [...KEYS.usuarios, search],
    queryFn: () => getUsuarios(search),
    staleTime: 1000 * 60 * 2,
  });
}

export function useUsuario(id: number) {
  return useQuery({
    queryKey: KEYS.usuario(id),
    queryFn: () => getUsuario(id),
    enabled: id > 0,
  });
}

export function useCreateUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UsuarioPayload) => createUsuario(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.usuarios });
      qc.refetchQueries({ queryKey: KEYS.usuarios });
    },
  });
}

export function useUpdateUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<UsuarioPayload>;
    }) => updateUsuario(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.usuarios });
      qc.invalidateQueries({ queryKey: KEYS.usuario(id) });
      qc.refetchQueries({ queryKey: KEYS.usuarios });
    },
  });
}

export function useDeleteUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteUsuario(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.usuarios });
      qc.refetchQueries({ queryKey: KEYS.usuarios });
    },
  });
}

// ── Grupos ────────────────────────────────────────────────────────────────────

export function useGrupos() {
  return useQuery({
    queryKey: KEYS.grupos,
    queryFn: getGrupos,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGrupo(id: number) {
  return useQuery({
    queryKey: KEYS.grupo(id),
    queryFn: () => getGrupo(id),
    enabled: id > 0,
  });
}

export function useCreateGrupo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GrupoPayload) => createGrupo(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.grupos });
      qc.refetchQueries({ queryKey: KEYS.grupos });
    },
  });
}

export function useUpdateGrupo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<GrupoPayload>;
    }) => updateGrupo(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.grupos });
      qc.refetchQueries({ queryKey: KEYS.grupos });
    },
  });
}

export function useDeleteGrupo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteGrupo(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.grupos });
      qc.refetchQueries({ queryKey: KEYS.grupos });
    },
  });
}

// ── Permisos ──────────────────────────────────────────────────────────────────

export function usePermisos() {
  return useQuery({
    queryKey: KEYS.permisos,
    queryFn: getPermisos,
    staleTime: 1000 * 60 * 10,
  });
}
