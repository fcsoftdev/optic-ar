import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import comprasService, {
  type CompraCreateUpdate,
  type GastoCreateUpdate,
  type Proveedor,
} from "../services/compras.service";

// ==================== HOOKS DE PROVEEDORES ====================

/**
 * Hook para obtener el listado paginado de proveedores.
 *
 * @param params - Filtros opcionales: search, page, page_size.
 * @returns Query paginada de proveedores.
 */
export const useProveedores = (params?: {
  search?: string;
  page?: number;
  page_size?: number;
}) => {
  return useQuery({
    queryKey: ["proveedores", params],
    queryFn: () => comprasService.getProveedores(params),
  });
};

/**
 * Hook para crear un nuevo proveedor.
 *
 * @returns Mutation para crear un proveedor, invalida el cache al éxito.
 */
export const useCreateProveedor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Proveedor, "id">) =>
      comprasService.createProveedor(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["proveedores"] });
      await queryClient.refetchQueries({ queryKey: ["proveedores"] });
    },
  });
};

/**
 * Hook para actualizar un proveedor existente.
 *
 * @returns Mutation para actualizar un proveedor dado su ID y datos.
 */
export const useUpdateProveedor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Omit<Proveedor, "id"> }) =>
      comprasService.updateProveedor(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["proveedores"] });
      await queryClient.refetchQueries({ queryKey: ["proveedores"] });
    },
  });
};

/**
 * Hook para eliminar un proveedor.
 *
 * @returns Mutation para eliminar un proveedor dado su ID.
 */
export const useDeleteProveedor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => comprasService.deleteProveedor(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["proveedores"] });
      await queryClient.refetchQueries({ queryKey: ["proveedores"] });
    },
  });
};

// ==================== HOOKS DE COMPRAS ====================

/**
 * Hook para obtener el listado paginado de compras.
 *
 * @param params - Filtros opcionales: search, page, page_size, proveedor.
 * @returns Query paginada de compras (datos simplificados para tabla).
 */
export const useCompras = (params?: {
  search?: string;
  page?: number;
  page_size?: number;
  proveedor?: number;
}) => {
  return useQuery({
    queryKey: ["compras", params],
    queryFn: () => comprasService.getCompras(params),
  });
};

/**
 * Hook para obtener una compra completa con sus detalles.
 *
 * @param id - ID de la compra. La query solo se ejecuta si id > 0.
 * @returns Query con la compra completa.
 */
export const useCompra = (id: number) => {
  return useQuery({
    queryKey: ["compra", id],
    queryFn: () => comprasService.getCompra(id),
    enabled: id > 0,
  });
};

/**
 * Hook para crear una nueva compra.
 *
 * @remarks
 * Al crear exitosamente invalida el cache de compras y productos
 * para reflejar el nuevo stock en la UI.
 *
 * @returns Mutation para crear una compra.
 */
export const useCreateCompra = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CompraCreateUpdate) => comprasService.createCompra(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["compras"] });
      await queryClient.refetchQueries({ queryKey: ["compras"] });
      await queryClient.invalidateQueries({ queryKey: ["productos"] });
    },
  });
};

/**
 * Hook para actualizar una compra existente.
 *
 * @remarks
 * Al actualizar exitosamente invalida el cache de compras y productos.
 *
 * @returns Mutation para actualizar una compra dado su ID y datos.
 */
export const useUpdateCompra = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CompraCreateUpdate }) =>
      comprasService.updateCompra(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["compras"] });
      await queryClient.refetchQueries({ queryKey: ["compras"] });
      await queryClient.invalidateQueries({ queryKey: ["productos"] });
    },
  });
};

/**
 * Hook para eliminar una compra.
 *
 * @remarks
 * La señal Django ``descontar_stock_al_eliminar_compra`` revierte
 * automáticamente el stock al eliminar. Este hook invalida el cache
 * de compras y productos tras la eliminación exitosa.
 *
 * @returns Mutation para eliminar una compra dado su ID.
 */
export const useDeleteCompra = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => comprasService.deleteCompra(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["compras"] });
      await queryClient.refetchQueries({ queryKey: ["compras"] });
      await queryClient.invalidateQueries({ queryKey: ["productos"] });
    },
  });
};

// ==================== HOOKS DE GASTOS ====================

/**
 * Hook para obtener el listado paginado de gastos.
 *
 * @param params - Filtros opcionales: search, page, page_size.
 * @returns Query paginada de gastos.
 */
export const useGastos = (params?: {
  search?: string;
  page?: number;
  page_size?: number;
}) => {
  return useQuery({
    queryKey: ["gastos", params],
    queryFn: () => comprasService.getGastos(params),
  });
};

/**
 * Hook para crear un nuevo gasto.
 *
 * @returns Mutation para crear un gasto, invalida el cache al éxito.
 */
export const useCreateGasto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GastoCreateUpdate) => comprasService.createGasto(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["gastos"] });
      await queryClient.refetchQueries({ queryKey: ["gastos"] });
    },
  });
};

/**
 * Hook para actualizar un gasto existente.
 *
 * @returns Mutation para actualizar un gasto dado su ID y datos.
 */
export const useUpdateGasto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: GastoCreateUpdate }) =>
      comprasService.updateGasto(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["gastos"] });
      await queryClient.refetchQueries({ queryKey: ["gastos"] });
    },
  });
};

/**
 * Hook para eliminar un gasto.
 *
 * @returns Mutation para eliminar un gasto dado su ID.
 */
export const useDeleteGasto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => comprasService.deleteGasto(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["gastos"] });
      await queryClient.refetchQueries({ queryKey: ["gastos"] });
    },
  });
};
