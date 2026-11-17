export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TipoVehiculo = 'car' | 'motorcycle' | 'bicycle' | 'scooter';
export type VehicleType = TipoVehiculo;

export interface Database {
  public: {
    Tables: {
      vehicles: {
        Row: {
          id: string;
          user_id: string;
          type: TipoVehiculo;
          name: string;
          brand: string | null;
          model: string | null;
          year: number | null;
          plate: string | null;
          current_km: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          type: TipoVehiculo;
          name: string;
          brand?: string | null;
          model?: string | null;
          year?: number | null;
          plate?: string | null;
          current_km?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: TipoVehiculo;
          name?: string;
          brand?: string | null;
          model?: string | null;
          year?: number | null;
          plate?: string | null;
          current_km?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      maintenance_records: {
        Row: {
          id: string;
          vehicle_id: string;
          user_id: string;
          service_type: string;
          service_date: string;
          odometer_km: number | null;
          cost: number;
          notes: string | null;
          next_due_km: number | null;
          next_due_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          user_id?: string;
          service_type: string;
          service_date?: string;
          odometer_km: number | null;
          cost?: number;
          notes?: string | null;
          next_due_km?: number | null;
          next_due_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          user_id?: string;
          service_type?: string;
          service_date?: string;
          odometer_km?: number | null;
          cost?: number;
          notes?: string | null;
          next_due_km?: number | null;
          next_due_date?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "maintenance_records_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type BaseDeDatos = Database;
