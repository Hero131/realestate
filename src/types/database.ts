export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      brokers: {
        Row: {
          auth_user_id: string
          company_name: string
          created_at: string
          id: string
          phone: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          auth_user_id: string
          company_name: string
          created_at?: string
          id?: string
          phone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          auth_user_id?: string
          company_name?: string
          created_at?: string
          id?: string
          phone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      domains: {
        Row: {
          broker_id: string
          created_at: string
          hostname: string
          id: string
          is_primary: boolean
        }
        Insert: {
          broker_id: string
          created_at?: string
          hostname: string
          id?: string
          is_primary?: boolean
        }
        Update: {
          broker_id?: string
          created_at?: string
          hostname?: string
          id?: string
          is_primary?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'domains_broker_id_fkey'
            columns: ['broker_id']
            isOneToOne: false
            referencedRelation: 'brokers'
            referencedColumns: ['id']
          },
        ]
      }
      nearby_amenities: {
        Row: {
          broker_id: string
          category: string
          created_at: string
          id: string
          name: string
          property_id: string
          sort_order: number
          travel_time: string
        }
        Insert: {
          broker_id: string
          category: string
          created_at?: string
          id?: string
          name: string
          property_id: string
          sort_order?: number
          travel_time: string
        }
        Update: {
          broker_id?: string
          category?: string
          created_at?: string
          id?: string
          name?: string
          property_id?: string
          sort_order?: number
          travel_time?: string
        }
        Relationships: [
          {
            foreignKeyName: 'nearby_amenities_broker_id_fkey'
            columns: ['broker_id']
            isOneToOne: false
            referencedRelation: 'brokers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'nearby_amenities_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'properties'
            referencedColumns: ['id']
          },
        ]
      }
      properties: {
        Row: {
          bedrooms: number | null
          broker_id: string
          bullet_facts: string[]
          created_at: string
          id: string
          is_featured: boolean
          location: string
          parking: number | null
          price_max: number | null
          price_min: number | null
          property_type: string
          size_label: string | null
          size_sqft: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          bedrooms?: number | null
          broker_id: string
          bullet_facts?: string[]
          created_at?: string
          id?: string
          is_featured?: boolean
          location: string
          parking?: number | null
          price_max?: number | null
          price_min?: number | null
          property_type: string
          size_label?: string | null
          size_sqft?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          bedrooms?: number | null
          broker_id?: string
          bullet_facts?: string[]
          created_at?: string
          id?: string
          is_featured?: boolean
          location?: string
          parking?: number | null
          price_max?: number | null
          price_min?: number | null
          property_type?: string
          size_label?: string | null
          size_sqft?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'properties_broker_id_fkey'
            columns: ['broker_id']
            isOneToOne: false
            referencedRelation: 'brokers'
            referencedColumns: ['id']
          },
        ]
      }
      property_images: {
        Row: {
          alt_text: string | null
          broker_id: string
          created_at: string
          id: string
          property_id: string
          public_url: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          alt_text?: string | null
          broker_id: string
          created_at?: string
          id?: string
          property_id: string
          public_url: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          alt_text?: string | null
          broker_id?: string
          created_at?: string
          id?: string
          property_id?: string
          public_url?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: 'property_images_broker_id_fkey'
            columns: ['broker_id']
            isOneToOne: false
            referencedRelation: 'brokers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'property_images_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'properties'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Broker = Database['public']['Tables']['brokers']['Row']
export type Domain = Database['public']['Tables']['domains']['Row']
export type Property = Database['public']['Tables']['properties']['Row']
export type PropertyImage = Database['public']['Tables']['property_images']['Row']
export type NearbyAmenity = Database['public']['Tables']['nearby_amenities']['Row']
