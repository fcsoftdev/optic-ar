import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ventasService, {
  type ClienteCreateUpdate,
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
    mutationFn: (nombre: string) => ventasService.createObraSocial(nombre),
    onSuccess: (newObraSocial) => {
      queryClient.setQueryData(["obras-sociales"], (old: any) => {
        if (!old) return [newObraSocial];
        return [...old, newObraSocial];
      });
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
