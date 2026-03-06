import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ventasService, {
  type ClienteCreateUpdate,
  type ObraSocial,
  type ConsultaCreateUpdate,
} from "../services/ventas.service";

// ==================== HOOKS DE OBRAS SOCIALES ====================

/**
 * Hook para obtener el listado completo de obras sociales.
 *
 * @returns Query con el array de obras sociales ordenadas por nombre.
 */
export const useObrasSociales = () => {
  return useQuery({
    queryKey: ["obras-sociales"],
    queryFn: () => ventasService.getObrasSociales(),
  });
};

/**
 * Hook para obtener obras sociales paginadas con búsqueda (ABM).
 *
 * @param params - Parámetros de página y búsqueda.
 * @returns Query paginada de obras sociales.
 */
export const useObrasSocialesPaginadas = (params?: {
  page?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: ["obras-sociales-paginadas", params],
    queryFn: () => ventasService.getObrasSocialesPaginadas(params),
  });
};

/**
 * Hook para crear una nueva obra social.
 *
 * @remarks
 * Al crear exitosamente, actualiza el cache local de obras sociales
 * sin necesidad de un refetch al servidor.
 *
 * @returns Mutation para crear una obra social dado su nombre.
 */
export const useCreateObraSocial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<ObraSocial, "id">) =>
      ventasService.createObraSocial(data),
    onSuccess: (newObraSocial) => {
      queryClient.setQueryData(["obras-sociales"], (old: any) => {
        if (!old) return [newObraSocial];
        return [...old, newObraSocial];
      });
      queryClient.invalidateQueries({ queryKey: ["obras-sociales-paginadas"] });
    },
  });
};

/**
 * Hook para actualizar una obra social existente.
 *
 * @remarks
 * Reemplaza el item en el cache local por el objeto actualizado
 * devuelto por la API.
 *
 * @returns Mutation que recibe `{ id, data }` y actualiza la obra social.
 */
export const useUpdateObraSocial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      ventasService.updateObraSocial(id, data),
    onSuccess: (updatedObraSocial) => {
      queryClient.setQueryData(["obras-sociales"], (old: any) => {
        if (!old) return [updatedObraSocial];
        return old.map((os: any) =>
          os.id === updatedObraSocial.id ? updatedObraSocial : os,
        );
      });
      queryClient.invalidateQueries({ queryKey: ["obras-sociales-paginadas"] });
    },
  });
};

/**
 * Hook para eliminar una obra social.
 *
 * @remarks
 * Elimina el item del cache local usando el ID retornado por la mutación.
 *
 * @returns Mutation que recibe el `id` de la obra social a eliminar.
 */
export const useDeleteObraSocial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => ventasService.deleteObraSocial(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(["obras-sociales"], (old: any) => {
        if (!old) return [];
        return old.filter((os: any) => os.id !== deletedId);
      });
      queryClient.invalidateQueries({ queryKey: ["obras-sociales-paginadas"] });
    },
  });
};

// ==================== HOOKS DE CLIENTES ====================

/**
 * Hook para obtener el listado paginado de clientes con filtros opcionales.
 *
 * @param params - Filtros opcionales de búsqueda y paginación.
 * @param params.page - Número de página (defecto: 1).
 * @param params.search - Término de búsqueda por DNI, nombre o email.
 * @param params.obra_social - ID de obra social para filtrar.
 * @returns Query paginada con los clientes que coincidan con los filtros.
 */
export const useClientes = (params?: {
  page?: number;
  search?: string;
  obra_social?: number;
  /** Tamaño de página. Usar un valor grande (ej: 9999) para cargar todos los registros en selectores. */
  page_size?: number;
}) => {
  return useQuery({
    queryKey: ["clientes", params],
    queryFn: () => ventasService.getClientes(params),
  });
};

/**
 * Hook para obtener el detalle completo de un cliente por su ID.
 *
 * @param id - ID del cliente a consultar. La query se deshabilita si es 0.
 * @returns Query con todos los campos del cliente incluyendo dirección y obra social.
 */
export const useCliente = (id: number) => {
  return useQuery({
    queryKey: ["cliente", id],
    queryFn: () => ventasService.getCliente(id),
    enabled: !!id,
  });
};

/**
 * Hook para crear un nuevo cliente/paciente.
 *
 * @remarks
 * Invalida el listado de clientes al crear exitosamente para
 * reflejar el nuevo registro en la tabla.
 *
 * @returns Mutation que recibe los datos del cliente y lo crea en la API.
 */
export const useCreateCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClienteCreateUpdate) =>
      ventasService.createCliente(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
};

/**
 * Hook para actualizar los datos de un cliente existente.
 *
 * @remarks
 * Actualiza el cache del detalle individual y luego invalida
 * el listado para mantener la tabla sincronizada.
 *
 * @returns Mutation que recibe `{ id, data }` y actualiza el cliente.
 */
export const useUpdateCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClienteCreateUpdate }) =>
      ventasService.updateCliente(id, data),
    onSuccess: (updatedCliente) => {
      queryClient.setQueryData(["cliente", updatedCliente.id], updatedCliente);
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
};

/**
 * Hook para eliminar un cliente.
 *
 * @remarks
 * Elimina el cache del detalle individual e invalida el listado
 * para que la tabla se actualice automáticamente.
 *
 * @returns Mutation que recibe el `id` del cliente a eliminar.
 */
export const useDeleteCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => ventasService.deleteCliente(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: ["cliente", deletedId] });
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
};

// ==================== HOOKS DE CONSULTAS ====================

/**
 * Hook para obtener el listado paginado de consultas con filtros opcionales.
 *
 * @param params - Filtros opcionales de búsqueda, paginación y fechas.
 * @param params.page - Número de página (defecto: 1).
 * @param params.search - Búsqueda por nombre de paciente o motivo.
 * @param params.cliente - ID de cliente para filtrar sus consultas.
 * @param params.fecha_desde - Fecha inicial del rango (YYYY-MM-DD).
 * @param params.fecha_hasta - Fecha final del rango (YYYY-MM-DD).
 * @returns Query paginada con las consultas que coincidan con los filtros.
 */
export const useConsultas = (params?: {
  page?: number;
  search?: string;
  cliente?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
}) => {
  return useQuery({
    queryKey: ["consultas", params],
    queryFn: () => ventasService.getConsultas(params),
  });
};

/**
 * Hook para obtener el detalle completo de una consulta por su ID.
 *
 * @param id - ID de la consulta. La query se deshabilita si es 0.
 * @returns Query con todos los campos de la consulta incluyendo graduación.
 */
export const useConsulta = (id: number) => {
  return useQuery({
    queryKey: ["consulta", id],
    queryFn: () => ventasService.getConsulta(id),
    enabled: !!id,
  });
};

/**
 * Hook para crear una nueva consulta médica.
 *
 * @remarks
 * Invalida el listado de consultas al crear exitosamente.
 *
 * @returns Mutation que recibe los datos de la consulta y la crea en la API.
 */
export const useCreateConsulta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ConsultaCreateUpdate) =>
      ventasService.createConsulta(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultas"] });
    },
  });
};

/**
 * Hook para actualizar una consulta existente.
 *
 * @remarks
 * Actualiza el cache del detalle individual e invalida el listado.
 *
 * @returns Mutation que recibe `{ id, data }` y actualiza la consulta.
 */
export const useUpdateConsulta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: ConsultaCreateUpdate;
    }) => ventasService.updateConsulta(id, data),
    onSuccess: (updatedConsulta) => {
      queryClient.setQueryData(
        ["consulta", updatedConsulta.id],
        updatedConsulta,
      );
      queryClient.invalidateQueries({ queryKey: ["consultas"] });
    },
  });
};

/**
 * Hook para eliminar una consulta.
 *
 * @remarks
 * Elimina el cache del detalle individual e invalida el listado.
 *
 * @returns Mutation que recibe el `id` de la consulta a eliminar.
 */
export const useDeleteConsulta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => ventasService.deleteConsulta(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: ["consulta", deletedId] });
      queryClient.invalidateQueries({ queryKey: ["consultas"] });
    },
  });
};
