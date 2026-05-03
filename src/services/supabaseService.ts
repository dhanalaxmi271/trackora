import { supabase } from '../lib/supabase';

/**
 * Supabase Generic Data Access Layer
 * Supports CRUD, Filtering, Pagination, and Relationship joins.
 */
export const supabaseService = {
  /**
   * Fetch all records from a table with advanced options
   */
  async getAll<T>(tableName: string, options?: { 
    select?: string; 
    filter?: Record<string, any>;
    limit?: number;
    offset?: number;
    sort?: { column: string; ascending?: boolean };
    match?: Record<string, any>; // Complex filters
  }) {
    console.log(`[Supabase] Fetching from ${tableName}...`);
    
    let query = supabase.from(tableName).select(options?.select || '*');
    
    // Simple equality filters
    if (options?.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    // Match object for multiple filters
    if (options?.match) {
      query = query.match(options.match);
    }
    
    // Sorting
    if (options?.sort) {
      query = query.order(options.sort.column, { ascending: options.sort.ascending ?? true });
    }
    
    // Pagination
    if (options?.limit) {
      const from = options.offset || 0;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;
    
    if (error) {
      console.error(`[Supabase Error] ${tableName} READ:`, error);
      throw error;
    }
    
    return { data: data as T[], count };
  },

  /**
   * Fetch a single record by ID
   */
  async getById<T>(tableName: string, id: string | number) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error(`[Supabase Error] ${tableName} GET BY ID:`, error);
      throw error;
    }
    return data as T;
  },

  /**
   * Create a new record
   */
  async createRecord<T>(tableName: string, data: Partial<T>) {
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(data as any)
      .select()
      .single();
      
    if (error) {
      console.error(`[Supabase Error] ${tableName} CREATE:`, error);
      throw error;
    }
    return result as T;
  },

  /**
   * Update a record by ID
   */
  async updateRecord<T>(tableName: string, id: string | number, data: Partial<T>) {
    const { data: result, error } = await supabase
      .from(tableName)
      .update(data as any)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error(`[Supabase Error] ${tableName} UPDATE:`, error);
      throw error;
    }
    return result as T;
  },

  /**
   * Delete a record by ID
   */
  async deleteRecord(tableName: string, id: string | number) {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error(`[Supabase Error] ${tableName} DELETE:`, error);
      throw error;
    }
    return true;
  },

  /**
   * Execute a custom RPC function or raw query (if needed)
   */
  async rpc(fnName: string, params?: any) {
    const { data, error } = await supabase.rpc(fnName, params);
    if (error) throw error;
    return data;
  }
};
