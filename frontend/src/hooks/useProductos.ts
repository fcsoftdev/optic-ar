import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import productosService, {
  type ProductoCreateUpdate,
} from "../services/productos.service";

/**
 * ============================================
 * HOOKS DE REACT QUERY PARA PRODUCTOS
 * ============================================
 *
 * Estos hooks integran productosService con React Query para:
 * - Gestión automática de cache
 * - Estado de loading/error
 * - Refetch automático cuando los datos cambian
 * - Invalidación de cache después de mutaciones
 *
 * Nomenclatura:
 * - useXxx: Hooks para LEER datos (GET) - usan useQuery
 * - useCreateXxx: Hooks para CREAR (POST) - usan useMutation
 * - useUpdateXxx: Hooks para ACTUALIZAR (PUT) - usan useMutation
 * - useDeleteXxx: Hooks para ELIMINAR (DELETE) - usan useMutation
 *
 * OPTIMIZACIONES DE CACHE:
 * ========================
 * Los hooks de mutación usan técnicas optimizadas para actualizar el cache:
 *
 * 1. setQueryData(): Actualiza manualmente el cache sin hacer refetch
 *    - Usado en marcas, categorías y subcategorías (listas pequeñas)
 *    - Evita llamadas HTTP innecesarias
 *    - Actualización instantánea en la UI
 *
 * 2. setQueriesData(): Actualiza múltiples queries que coinciden con un patrón
 *    - Usado en subcategorías que pueden estar cacheadas con diferentes filtros
 *    - Ej: ["subcategorias", 1], ["subcategorias", 2], ["subcategorias", undefined]
 *
 * 3. invalidateQueries(): Solo se usa cuando es necesario refetch del servidor
 *    - Productos: Por paginación y conteo total
 *    - Subcategorías al eliminar categoría: Por eliminación en cascada
 *
 * Ventajas de actualización manual de cache:
 * - ⚡ Respuesta instantánea en UI (sin esperar HTTP)
 * - 📉 Reducción de tráfico de red (menos peticiones)
 * - 🎯 Control preciso sobre qué se actualiza
 * - 🔄 Sincronización automática entre vistas que usan los mismos datos
 */

// ==================== HOOKS DE PRODUCTOS ====================

/**
 * Hook para obtener lista de productos con filtros y paginación
 *
 * @param params - Parámetros opcionales de filtrado
 * @returns Objeto con data, isLoading, error, etc.
 *
 * @example
 * const { data, isLoading } = useProductos({ page: 2, search: "ray ban" });
 *
 * if (isLoading) return <Spinner />;
 * return <ProductTable productos={data.results} />;
 */
export const useProductos = (params?: {
  page?: number;
  search?: string;
  marca?: number;
  categoria?: number;
  sub_categoria?: number;
}) => {
  return useQuery({
    queryKey: ["productos", params], // Cache key - se invalida cuando cambia params
    queryFn: () => productosService.getProductos(params), // Función que hace el fetch
  });
};

/**
 * Hook para obtener un producto específico por ID
 *
 * @param id - ID del producto a consultar
 * @returns Objeto con data (Producto), isLoading, error
 *
 * @example
 * const { data: producto } = useProducto(42);
 * console.log(producto?.nombre); // "Lentes Ray-Ban Aviator"
 */
export const useProducto = (id: number) => {
  return useQuery({
    queryKey: ["producto", id],
    queryFn: () => productosService.getProducto(id),
    enabled: !!id, // Solo hace fetch si id es válido (no 0, null, undefined)
  });
};

/**
 * Hook para crear un nuevo producto
 *
 * @returns Objeto con mutate/mutateAsync para ejecutar la creación
 *
 * @example
 * const createProducto = useCreateProducto();
 *
 * const handleSubmit = async (data) => {
 *   await createProducto.mutateAsync(data);
 *   // Automáticamente invalida cache de productos y refresca la lista
 * };
 */
export const useCreateProducto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProductoCreateUpdate) =>
      productosService.createProducto(data),
    // onSuccess se ejecuta después de crear exitosamente
    // Invalidamos solo para refrescar la lista paginada desde el servidor
    // ya que necesitamos el conteo total actualizado
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
    },
  });
};

/**
 * Hook para actualizar un producto existente
 *
 * @returns Objeto con mutate/mutateAsync
 *
 * @example
 * const updateProducto = useUpdateProducto();
 *
 * await updateProducto.mutateAsync({
 *   id: 42,
 *   data: { ...producto, precio_venta: 30000 }
 * });
 */
export const useUpdateProducto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductoCreateUpdate }) =>
      productosService.updateProducto(id, data),
    onSuccess: (updatedProducto) => {
      // Actualizar el producto individual en cache
      queryClient.setQueryData(
        ["producto", updatedProducto.id],
        updatedProducto
      );

      // Invalidar la lista de productos para refrescar (necesario por paginación)
      queryClient.invalidateQueries({ queryKey: ["productos"] });
    },
  });
};

/**
 * Hook para eliminar un producto
 *
 * @returns Objeto con mutate/mutateAsync
 *
 * @example
 * const deleteProducto = useDeleteProducto();
 *
 * const handleDelete = async (id) => {
 *   if (confirm("¿Eliminar producto?")) {
 *     await deleteProducto.mutateAsync(id);
 *   }
 * };
 */
export const useDeleteProducto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => productosService.deleteProducto(id),
    onSuccess: (_, deletedId) => {
      // Remover el producto individual del cache
      queryClient.removeQueries({ queryKey: ["producto", deletedId] });

      // Invalidar lista de productos (necesario por paginación y conteo)
      queryClient.invalidateQueries({ queryKey: ["productos"] });
    },
  });
};

// ==================== HOOKS DE MARCAS ====================

/**
 * Hook para obtener lista de marcas con paginación opcional
 *
 * @param params - Parámetros opcionales (page, search)
 * @returns Objeto con data (paginada o array simple), isLoading, error
 *
 * @example
 * // Sin paginación (devuelve array simple)
 * const { data: marcas = [] } = useMarcas();
 *
 * // Con paginación
 * const { data } = useMarcas({ page: 2, search: "ray" });
 * const marcas = Array.isArray(data) ? data : data?.results || [];
 */
export const useMarcas = (params?: { page?: number; search?: string }) => {
  return useQuery({
    queryKey: ["marcas", params],
    queryFn: () => productosService.getMarcas(params),
  });
};

/**
 * Hook para obtener todas las categorías
 *
 * @returns Array de categorías con estado de loading/error
 */
export const useCategorias = () => {
  return useQuery({
    queryKey: ["categorias"],
    queryFn: () => productosService.getCategorias(),
  });
};

/**
 * Hook para obtener subcategorías filtradas por categoría
 *
 * @param categoriaId - ID de la categoría para filtrar (opcional)
 * @returns Array de subcategorías
 * @note Solo hace fetch si categoriaId está definido
 *
 * @example
 * const selectedCategoria = watch("categoria");
 * const { data: subcategorias = [] } = useSubCategorias(selectedCategoria);
 */
export const useSubCategorias = (categoriaId?: number) => {
  return useQuery({
    queryKey: ["subcategorias", categoriaId],
    queryFn: () => productosService.getSubCategorias(categoriaId),
    enabled: categoriaId !== undefined, // Solo fetch si hay categoría seleccionada
  });
};

/**
 * Hook para crear una nueva marca
 *
 * Usa setQueriesData para actualizar todas las queries de marcas en cache
 * sin hacer refetch del servidor (optimización de performance).
 *
 * @returns Objeto con mutateAsync que devuelve la marca creada
 *
 * @example
 * const createMarca = useCreateMarca();
 * const newMarca = await createMarca.mutateAsync("Ray-Ban");
 */
export const useCreateMarca = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nombre: string) => productosService.createMarca(nombre),
    onSuccess: (newMarca) => {
      // Actualizar todas las queries de marcas (con cualquier parámetro)
      queryClient.setQueriesData({ queryKey: ["marcas"] }, (old: any) => {
        if (!old) return old;

        // Si la respuesta es paginada
        if (old.results && Array.isArray(old.results)) {
          return {
            ...old,
            results: [...old.results, newMarca],
            count: (old.count || 0) + 1,
          };
        }

        // Si es un array simple
        if (Array.isArray(old)) {
          return [...old, newMarca];
        }

        return old;
      });
    },
  });
};

/**
 * Hook para crear una nueva categoría
 *
 * Comportamiento: Invalida y refresca cache dentro de mutationFn
 * para actualización inmediata en modales.
 */
export const useCreateCategoria = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nombre: string) => {
      const newCategoria = await productosService.createCategoria(nombre);

      // Actualizar cache de categorías manualmente
      queryClient.setQueryData(["categorias"], (old: any) => {
        if (!old) return [newCategoria];
        return [...old, newCategoria];
      });

      return newCategoria;
    },
  });
};

/**
 * Hook para crear una nueva subcategoría
 *
 * IMPORTANTE: Invalida TODAS las queries de subcategorías (sin filtro por categoría)
 * para que se actualicen todos los hooks useSubCategorias activos,
 * independientemente de qué categoría estén observando.
 *
 * @example
 * const createSubCategoria = useCreateSubCategoria();
 * const nuevaSubcat = await createSubCategoria.mutateAsync({
 *   nombre: "Polarizados",
 *   categoria: 2
 * });
 */
export const useCreateSubCategoria = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { nombre: string; categoria: number }) => {
      const newSubCategoria = await productosService.createSubCategoria(data);

      // Actualizar cache de subcategorías específicas de esta categoría
      queryClient.setQueryData(
        ["subcategorias", data.categoria],
        (old: any) => {
          if (!old) return [newSubCategoria];
          return [...old, newSubCategoria];
        }
      );

      // También actualizar cache sin filtro (si existe)
      queryClient.setQueryData(["subcategorias", undefined], (old: any) => {
        if (!old) return [newSubCategoria];
        return [...old, newSubCategoria];
      });

      return newSubCategoria;
    },
  });
};

/**
 * Hook para actualizar una marca existente
 *
 * Usa setQueriesData para actualizar todas las queries de marcas en cache.
 */
export const useUpdateMarca = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, nombre }: { id: number; nombre: string }) =>
      productosService.updateMarca(id, nombre),
    onSuccess: (updatedMarca) => {
      // Actualizar todas las queries de marcas reemplazando la marca modificada
      queryClient.setQueriesData({ queryKey: ["marcas"] }, (old: any) => {
        if (!old) return old;

        // Si la respuesta es paginada
        if (old.results && Array.isArray(old.results)) {
          return {
            ...old,
            results: old.results.map((marca: any) =>
              marca.id === updatedMarca.id ? updatedMarca : marca
            ),
          };
        }

        // Si es un array simple
        if (Array.isArray(old)) {
          return old.map((marca: any) =>
            marca.id === updatedMarca.id ? updatedMarca : marca
          );
        }

        return old;
      });
    },
  });
};

/**
 * Hook para eliminar una marca
 *
 * Usa setQueriesData para actualizar todas las queries de marcas en cache.
 *
 * @throws Error si la marca está siendo usada por productos
 */
export const useDeleteMarca = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => productosService.deleteMarca(id),
    onSuccess: (_, deletedId) => {
      // Actualizar todas las queries de marcas eliminando la marca
      queryClient.setQueriesData({ queryKey: ["marcas"] }, (old: any) => {
        if (!old) return old;

        // Si la respuesta es paginada
        if (old.results && Array.isArray(old.results)) {
          return {
            ...old,
            results: old.results.filter((marca: any) => marca.id !== deletedId),
            count: Math.max((old.count || 0) - 1, 0),
          };
        }

        // Si es un array simple
        if (Array.isArray(old)) {
          return old.filter((marca: any) => marca.id !== deletedId);
        }

        return old;
      });
    },
  });
};

/**
 * Hook para actualizar una categoría existente
 */
export const useUpdateCategoria = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, nombre }: { id: number; nombre: string }) => {
      const updatedCategoria = await productosService.updateCategoria(
        id,
        nombre
      );

      // Actualizar cache de categorías reemplazando la modificada
      queryClient.setQueryData(["categorias"], (old: any) => {
        if (!old) return [updatedCategoria];
        return old.map((cat: any) => (cat.id === id ? updatedCategoria : cat));
      });

      return updatedCategoria;
    },
  });
};

/**
 * Hook para eliminar una categoría
 *
 * @note También invalida subcategorías porque se eliminan en cascada
 * @throws Error si la categoría está siendo usada por productos
 */
export const useDeleteCategoria = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await productosService.deleteCategoria(id);

      // Actualizar cache de categorías eliminando la categoría
      queryClient.setQueryData(["categorias"], (old: any) => {
        if (!old) return [];
        return old.filter((cat: any) => cat.id !== id);
      });

      // Invalidar subcategorías porque se eliminan en cascada
      // Aquí sí necesitamos invalidar porque no sabemos qué subcats se eliminaron
      queryClient.invalidateQueries({ queryKey: ["subcategorias"] });
    },
  });
};

/**
 * Hook para actualizar una subcategoría
 *
 * Permite cambiar nombre y/o categoría padre
 */
export const useUpdateSubCategoria = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      nombre,
      categoria,
    }: {
      id: number;
      nombre: string;
      categoria: number;
    }) => {
      const updatedSubCategoria = await productosService.updateSubCategoria(
        id,
        { nombre, categoria }
      );

      // Actualizar todas las caches de subcategorías que puedan contener este item
      queryClient.setQueriesData(
        { queryKey: ["subcategorias"] },
        (old: any) => {
          if (!old) return old;
          return old.map((subcat: any) =>
            subcat.id === id ? updatedSubCategoria : subcat
          );
        }
      );

      return updatedSubCategoria;
    },
  });
};

/**
 * Hook para eliminar una subcategoría
 *
 * @throws Error si la subcategoría está siendo usada por productos
 */
export const useDeleteSubCategoria = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await productosService.deleteSubCategoria(id);

      // Actualizar todas las caches de subcategorías eliminando el item
      queryClient.setQueriesData(
        { queryKey: ["subcategorias"] },
        (old: any) => {
          if (!old) return old;
          return old.filter((subcat: any) => subcat.id !== id);
        }
      );
    },
  });
};
