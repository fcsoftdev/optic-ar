import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import turnosService, {
  type ConfiguracionCalendarioUpdate,
  type TurnoCreateUpdate,
} from "../services/turnos.service";

/**
 * Hook para obtener el listado de turnos en un rango de fechas.
 *
 * @remarks
 * La paginación está deshabilitada en el backend: devuelve todos los
 * turnos del rango en un array directo (sin wrapper paginado).
 *
 * @param params - Filtros opcionales: start, end, cliente, search.
 * @returns Query con array de turnos.
 */
export const useTurnos = (params?: {
  start?: string;
  end?: string;
  cliente?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: ["turnos", params],
    queryFn: () => turnosService.getTurnos(params),
    enabled: !!(params?.start && params?.end),
  });
};

/**
 * Hook para crear un nuevo turno.
 *
 * @returns Mutation para crear un turno, invalida el cache al éxito.
 */
export const useCreateTurno = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TurnoCreateUpdate) => turnosService.createTurno(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["turnos"] });
      await queryClient.refetchQueries({ queryKey: ["turnos"] });
    },
  });
};

/**
 * Hook para actualizar un turno existente (PATCH parcial).
 *
 * @remarks
 * Usado también para drag & drop: solo envía fecha/hora_inicio.
 *
 * @returns Mutation para actualizar un turno dado su ID y datos parciales.
 */
export const useUpdateTurno = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<TurnoCreateUpdate>;
    }) => turnosService.updateTurno(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["turnos"] });
      await queryClient.refetchQueries({ queryKey: ["turnos"] });
    },
  });
};

/**
 * Hook para eliminar un turno.
 *
 * @returns Mutation para eliminar un turno dado su ID.
 */
export const useDeleteTurno = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => turnosService.deleteTurno(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["turnos"] });
      await queryClient.refetchQueries({ queryKey: ["turnos"] });
    },
  });
};

/**
 * Hook para obtener la configuración activa del calendario.
 *
 * @returns Query con los datos de ConfiguracionCalendario.
 */
export const useConfigCalendario = () => {
  return useQuery({
    queryKey: ["configuracion-calendario"],
    queryFn: () => turnosService.getConfigCalendario(),
  });
};

/**
 * Hook para actualizar la configuración activa del calendario.
 *
 * @returns Mutation que invalida el cache de configuracion-calendario y turnos.
 */
export const useUpdateConfigCalendario = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ConfiguracionCalendarioUpdate) =>
      turnosService.updateConfigCalendario(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["configuracion-calendario"],
      });
      await queryClient.refetchQueries({
        queryKey: ["configuracion-calendario"],
      });
    },
  });
};
