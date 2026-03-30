import api from "./api";

/**
 * ============================================
 * INTERFACES Y TIPOS DE DATOS
 * ============================================
 * Define la estructura de datos que vienen de la API
 * y que se envían en las peticiones
 */

/** Marca de producto (ej: Ray-Ban, Oakley) */
export interface Marca {
  id: number;
  nombre: string;
}

/** Categoría de producto (ej: Anteojos de Sol, Lentes de Contacto) */
export interface Categoria {
  id: number;
  nombre: string;
}

/** SubCategoría de producto (ej: Polarizados, Deportivos) */
export interface SubCategoria {
  id: number;
  nombre: string;
  categoria: number; // ID de la categoría padre
  categoria_nombre: string; // Nombre denormalizado para mostrar en UI
}

/** Producto completo con todos los campos */
export interface HistorialCosto {
  precio_compra: string;
  precio_costo: string;
  fecha: string;
  compra_id: number | null;
}

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  marca: number;
  marca_nombre: string;
  categoria: number;
  categoria_nombre: string;
  sub_categoria?: number;
  sub_categoria_nombre?: string;
  stock: number;
  precio_costo?: number;
  porcentaje_ganancia?: number;
  precio_venta: number;
  historial_costos?: HistorialCosto[];
}

/** Versión simplificada de Producto para listados (menos campos) */
export interface ProductoList {
  id: number;
  codigo: string;
  nombre: string;
  marca_nombre: string;
  categoria_nombre: string;
  sub_categoria_nombre?: string;
  stock: number;
  precio_venta: number;
}

/** Respuesta paginada de Django REST Framework */
export interface PaginatedResponse<T> {
  count: number; // Total de items
  next: string | null; // URL de la página siguiente (null si es la última)
  previous: string | null; // URL de la página anterior (null si es la primera)
  results: T[]; // Array de items de la página actual
}

/** Datos para crear o actualizar un producto */
export interface ProductoCreateUpdate {
  codigo: string;
  nombre: string;
  descripcion?: string;
  marca: number;
  categoria: number;
  sub_categoria?: number;
  stock: number;
  precio_costo?: number;
  porcentaje_ganancia?: number;
  precio_venta: number;
}

/**
 * ============================================
 * SERVICIO DE PRODUCTOS
 * ============================================
 * Encapsula todas las llamadas HTTP relacionadas con productos
 * Cada método corresponde a un endpoint de la API de Django
 */
const productosService = {
  /**
   * Obtener lista de productos con filtros y paginación
   *
   * @param params - Parámetros opcionales de filtrado y búsqueda
   *   - page: Número de página (1, 2, 3...)
   *   - search: Búsqueda por código o nombre
   *   - marca: Filtrar por ID de marca
   *   - categoria: Filtrar por ID de categoría
   *   - sub_categoria: Filtrar por ID de subcategoría
   *
   * @returns Lista paginada de productos
   *
   * @example
   * const response = await productosService.getProductos({
   *   page: 2,
   *   search: "ray ban",
   *   marca: 5
   * });
   * // GET /api/productos/?page=2&search=ray%20ban&marca=5
   */
  getProductos: async (params?: {
    page?: number;
    search?: string;
    marca?: number;
    categoria?: number;
    sub_categoria?: number;
    page_size?: number;
    ordering?: string;
  }): Promise<PaginatedResponse<ProductoList>> => {
    const response = await api.get("/api/productos/", { params });
    return response.data;
  },

  /**
   * Obtener un producto específico por su ID
   *
   * @param id - ID del producto a consultar
   * @returns Producto completo con todos los campos
   *
   * @example
   * const producto = await productosService.getProducto(42);
   * // GET /api/productos/42/
   */
  getProducto: async (id: number): Promise<Producto> => {
    const response = await api.get(`/api/productos/${id}/`);
    return response.data;
  },

  /**
   * Crear un nuevo producto
   *
   * @param data - Datos del producto a crear
   * @returns Producto creado con ID asignado
   *
   * @example
   * const nuevoProducto = await productosService.createProducto({
   *   codigo: "ARN1234",
   *   nombre: "Lentes Ray-Ban Aviator",
   *   marca: 5,
   *   categoria: 2,
   *   stock: 10,
   *   precio_venta: 25000
   * });
   * // POST /api/productos/
   */
  createProducto: async (data: ProductoCreateUpdate): Promise<Producto> => {
    const response = await api.post("/api/productos/", data);
    return response.data;
  },

  /**
   * Actualizar un producto existente
   *
   * @param id - ID del producto a actualizar
   * @param data - Nuevos datos del producto
   * @returns Producto actualizado
   *
   * @example
   * const productoActualizado = await productosService.updateProducto(42, {
   *   ...datosActuales,
   *   precio_venta: 30000
   * });
   * // PUT /api/productos/42/
   */
  updateProducto: async (
    id: number,
    data: ProductoCreateUpdate,
  ): Promise<Producto> => {
    const response = await api.put(`/api/productos/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar un producto
   *
   * @param id - ID del producto a eliminar
   * @returns void
   *
   * @example
   * await productosService.deleteProducto(42);
   * // DELETE /api/productos/42/
   */
  deleteProducto: async (id: number): Promise<void> => {
    await api.delete(`/api/productos/${id}/`);
  },

  /**
   * Aplica un porcentaje de aumento al precio_costo de los productos indicados.
   * @param ids - IDs de los productos a actualizar
   * @param porcentaje - Porcentaje de aumento (ej: 15.5 para 15.5%)
   */
  aumentoMasivo: async (ids: number[], porcentaje: number): Promise<{ actualizados: number }> => {
    const response = await api.post("/api/productos/aumento_masivo/", { ids, porcentaje });
    return response.data;
  },

  // ==================== MARCAS ====================

  /**
   * Obtener lista de marcas con paginación y búsqueda
   *
   * @param params - Parámetros opcionales (page, search)
   * @returns Respuesta paginada con marcas o array simple
   *
   * @example
   * const response = await productosService.getMarcas({ page: 2, search: "ray" });
   * // GET /api/marcas/?page=2&search=ray
   */
  getMarcas: async (params?: {
    page?: number;
    search?: string;
  }): Promise<PaginatedResponse<Marca> | Marca[]> => {
    const response = await api.get("/api/marcas/", { params });
    // Si la respuesta tiene estructura paginada, devolverla tal cual
    if (response.data.results) {
      return response.data;
    }
    // Si no hay paginación, devolver el array directamente
    return response.data;
  },

  /**
   * Crear una nueva marca
   *
   * @param nombre - Nombre de la marca (ej: "Ray-Ban")
   * @returns Marca creada con ID asignado
   */
  createMarca: async (nombre: string): Promise<Marca> => {
    const response = await api.post("/api/marcas/", { nombre });
    return response.data;
  },

  /**
   * Actualizar el nombre de una marca
   *
   * @param id - ID de la marca a actualizar
   * @param nombre - Nuevo nombre de la marca
   * @returns Marca actualizada
   */
  updateMarca: async (id: number, nombre: string): Promise<Marca> => {
    const response = await api.put(`/api/marcas/${id}/`, { nombre });
    return response.data;
  },

  /**
   * Eliminar una marca
   *
   * @param id - ID de la marca a eliminar
   * @throws Error si la marca está siendo usada por productos
   */
  deleteMarca: async (id: number): Promise<void> => {
    await api.delete(`/api/marcas/${id}/`);
  },

  // ==================== CATEGORÍAS ====================

  /**
   * Obtener lista completa de categorías
   *
   * @returns Array de categorías
   */
  getCategorias: async (): Promise<Categoria[]> => {
    const response = await api.get("/api/categorias/", { params: { page_size: 9999 } });
    return response.data.results || response.data;
  },

  /**
   * Crear una nueva categoría
   *
   * @param nombre - Nombre de la categoría
   * @returns Categoría creada con ID asignado
   */
  createCategoria: async (nombre: string): Promise<Categoria> => {
    const response = await api.post("/api/categorias/", { nombre });
    return response.data;
  },

  /**
   * Actualizar el nombre de una categoría
   *
   * @param id - ID de la categoría a actualizar
   * @param nombre - Nuevo nombre de la categoría
   * @returns Categoría actualizada
   */
  updateCategoria: async (id: number, nombre: string): Promise<Categoria> => {
    const response = await api.put(`/api/categorias/${id}/`, { nombre });
    return response.data;
  },

  /**
   * Eliminar una categoría
   *
   * @param id - ID de la categoría a eliminar
   * @throws Error si la categoría está siendo usada por productos
   * @note También elimina las subcategorías asociadas (cascade)
   */
  deleteCategoria: async (id: number): Promise<void> => {
    await api.delete(`/api/categorias/${id}/`);
  },

  // ==================== SUBCATEGORÍAS ====================

  /**
   * Obtener lista de subcategorías con filtro opcional por categoría
   *
   * @param categoriaId - ID de la categoría para filtrar (opcional)
   * @returns Array de subcategorías
   *
   * @example
   * // Obtener todas las subcategorías
   * const todas = await productosService.getSubCategorias();
   *
   * // Obtener solo subcategorías de categoría 5
   * const filtradas = await productosService.getSubCategorias(5);
   * // GET /api/subcategorias/?categoria=5
   */
  getSubCategorias: async (categoriaId?: number): Promise<SubCategoria[]> => {
    const params = categoriaId ? { categoria: categoriaId } : undefined;
    const response = await api.get("/api/subcategorias/", {
      params,
    });
    return response.data.results || response.data;
  },

  /**
   * Crear una nueva subcategoría
   *
   * @param data - Nombre y categoría padre de la subcategoría
   * @returns Subcategoría creada con ID asignado
   *
   * @example
   * const nuevaSubcat = await productosService.createSubCategoria({
   *   nombre: "Polarizados",
   *   categoria: 2
   * });
   */
  createSubCategoria: async (data: {
    nombre: string;
    categoria: number;
  }): Promise<SubCategoria> => {
    const response = await api.post("/api/subcategorias/", data);
    return response.data;
  },

  /**
   * Actualizar una subcategoría
   *
   * @param id - ID de la subcategoría a actualizar
   * @param data - Nuevos datos (nombre y/o categoría padre)
   * @returns Subcategoría actualizada
   */
  updateSubCategoria: async (
    id: number,
    data: { nombre: string; categoria: number },
  ): Promise<SubCategoria> => {
    const response = await api.put(`/api/subcategorias/${id}/`, data);
    return response.data;
  },

  /**
   * Eliminar una subcategoría
   *
   * @param id - ID de la subcategoría a eliminar
   * @throws Error si la subcategoría está siendo usada por productos
   */
  deleteSubCategoria: async (id: number): Promise<void> => {
    await api.delete(`/api/subcategorias/${id}/`);
  },
};

export default productosService;
