export interface Voter {
  id: number;
  phone: string;
  name: string;
  organization: string;
  status: string;
  created_at: Date;
}

export interface VoterStats {
  status: string;
  count: number;
}

export interface VoterResponse {
  success: boolean;
  data?: Voter[] | VoterStats[];
  error?: string;
}

export interface ActionResponse {
  success: boolean;
  error?: string;
}

export interface UpdateVoterData {
  name?: string;
  organization?: string;
  phone?: string;
}

export interface BulkActionResponse {
  success: boolean;
  error?: string;
  data?: Voter[] | VoterStats[];
}
