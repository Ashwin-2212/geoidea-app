import { createClient, SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

export interface UserDB {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'citizen' | 'moderator' | 'official' | 'admin' | 'student';
  department?: string;
  avatar?: string;
  bio?: string;
  points?: number;
  badges?: string[];
  is_verified?: boolean;
  refresh_token?: string;
  reset_token?: string;
  language_preference?: string;
  created_at: string;
}

export interface StatusHistoryEntry {
  status: string;
  updatedBy: string;
  role: string;
  timestamp: string;
  note?: string;
}

export interface IdeaDB {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  address?: string;
  image_url?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'submitted' | 'verified' | 'under_review' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  department_assigned?: string;
  assigned_official_name?: string;
  resolution_notes?: string;
  resolution_image_url?: string;
  ai_confidence_score?: number;
  ai_detected_tags?: string[];
  status_history?: StatusHistoryEntry[];
  created_at: string;
  updated_at: string;
}

export interface CommentDB {
  id: string;
  idea_id: string;
  user_id: string;
  text: string;
  created_at: string;
}

export interface LikeDB {
  id: string;
  idea_id: string;
  user_id: string;
  created_at: string;
}

export interface VerificationDB {
  id: string;
  idea_id: string;
  user_id: string;
  comment?: string;
  created_at: string;
}

// Check for external Supabase config
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

export let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Connected to Supabase backend client');
  } catch (err) {
    console.warn('⚠️ Could not initialize Supabase client, using local persistent DB store:', err);
  }
}

// Local Persistent File Database Store fallback
const DB_FILE_PATH = path.join(process.cwd(), 'data_store.json');

interface DataStoreSchema {
  users: UserDB[];
  ideas: IdeaDB[];
  comments: CommentDB[];
  likes: LikeDB[];
  verifications: VerificationDB[];
}

// Initial seed data for vibrant interactive experience on load (Centered around Chennai, India)
function getSeedData(): DataStoreSchema {
  const defaultPasswordHash = bcrypt.hashSync('Password123!', 8);
  const now = new Date().toISOString();

  const citizenUser: UserDB = {
    id: 'usr-student-1',
    name: 'Aravind Kumar',
    email: 'student@chennai.edu',
    password_hash: defaultPasswordHash,
    role: 'citizen',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
    bio: 'Anna University Computer Science student passionate about smart mobility & eco solutions in Chennai.',
    points: 85,
    badges: ['Local Hero', 'Verified Contributor', 'Eco Warrior'],
    is_verified: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  };

  const adminUser: UserDB = {
    id: 'usr-admin-1',
    name: 'Dr. Meenakshi Sundaram',
    email: 'admin@chennai.edu',
    password_hash: defaultPasswordHash,
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    bio: 'Smart City Campus Director & Admin oversee GeoIdeas in Chennai.',
    points: 250,
    badges: ['Top Innovator', 'Community Guardian'],
    is_verified: true,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString()
  };

  const officialUser: UserDB = {
    id: 'usr-official-1',
    name: 'Eng. Rajesh V. (Municipal Officer)',
    email: 'official@chennai.gov.in',
    password_hash: defaultPasswordHash,
    role: 'official',
    department: 'Public Works & Roads',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    bio: 'Greater Chennai Corporation Assistant Engineer managing public infrastructure & road safety.',
    points: 180,
    badges: ['Municipal Resolver'],
    is_verified: true,
    created_at: new Date(Date.now() - 40 * 86400000).toISOString()
  };

  const moderatorUser: UserDB = {
    id: 'usr-mod-1',
    name: 'Kavitha S. (Community Mod)',
    email: 'moderator@civicpulse.org',
    password_hash: defaultPasswordHash,
    role: 'moderator',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
    bio: 'Civic Watch Volunteer reviewing citizen reports and deduplicating municipal issues.',
    points: 120,
    badges: ['Community Guardian'],
    is_verified: true,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString()
  };

  const user2: UserDB = {
    id: 'usr-102',
    name: 'Priya Raman',
    email: 'priya@geoidea.io',
    password_hash: defaultPasswordHash,
    role: 'citizen',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
    bio: 'Environmental engineering student advocating for Chennai coastal preservation.',
    points: 65,
    badges: ['Eco Warrior'],
    is_verified: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString()
  };

  const seedIdeas: IdeaDB[] = [
    {
      id: 'idea-chennai-1',
      user_id: citizenUser.id,
      title: 'Marina Beach Solar Smart Benches & Ocean Plastic Bins',
      description: 'Deploy solar-powered shaded benches with free Wi-Fi and smart recycling sensors along Marina Beach promenade to keep the coastline clean and powered.',
      category: 'Green & Eco',
      severity: 'medium',
      status: 'verified',
      department_assigned: 'Sanitation & Waste',
      latitude: 13.0499,
      longitude: 80.2824,
      address: 'Marina Beach Promenade, Triplicane, Chennai, Tamil Nadu, India',
      image_url: 'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&q=80&w=800',
      ai_confidence_score: 94,
      ai_detected_tags: ['Solar Energy', 'Beach Cleanup', 'Smart Dustbin', 'Wi-Fi Hotspot'],
      status_history: [
        { status: 'submitted', updatedBy: 'Aravind Kumar', role: 'citizen', timestamp: new Date(Date.now() - 5 * 86400000).toISOString(), note: 'Submitted issue report.' },
        { status: 'verified', updatedBy: 'Community Verification Engine', role: 'system', timestamp: new Date(Date.now() - 4 * 86400000).toISOString(), note: '3 citizens verified on site.' }
      ],
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 4 * 86400000).toISOString()
    },
    {
      id: 'idea-chennai-2',
      user_id: adminUser.id,
      title: 'Anna University Guindy Campus IoT Solar Shuttle',
      description: 'Autonomous solar-assisted EV campus shuttles for students and staff linking Guindy railway station to college departments.',
      category: 'Smart City',
      severity: 'low',
      status: 'in_progress',
      department_assigned: 'Traffic & Transit',
      assigned_official_name: 'Eng. Rajesh V.',
      latitude: 13.0102,
      longitude: 80.2357,
      address: 'Anna University Guindy Campus, Sardar Patel Rd, Chennai, India',
      image_url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800',
      ai_confidence_score: 98,
      ai_detected_tags: ['Electric Vehicle', 'Autonomous Transit', 'Solar Campus'],
      status_history: [
        { status: 'submitted', updatedBy: 'Dr. Meenakshi Sundaram', role: 'admin', timestamp: new Date(Date.now() - 3 * 86400000).toISOString() },
        { status: 'assigned', updatedBy: 'Dr. Meenakshi Sundaram', role: 'admin', timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), note: 'Assigned to Traffic & Transit division.' },
        { status: 'in_progress', updatedBy: 'Eng. Rajesh V.', role: 'official', timestamp: new Date(Date.now() - 1 * 86400000).toISOString(), note: 'EV route survey initiated with Anna Univ engineering team.' }
      ],
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 'idea-chennai-3',
      user_id: user2.id,
      title: 'T. Nagar Pedestrianized Smart Plaza & Shaded Canopy',
      description: 'Transform busy shopping lanes in Pondy Bazaar with green vertical plant walls, shaded misting pods, and zero-emission pedestrian zones.',
      category: 'Community',
      severity: 'medium',
      status: 'verified',
      department_assigned: 'Public Works & Roads',
      latitude: 13.0418,
      longitude: 80.2341,
      address: 'Pondy Bazaar, T. Nagar, Chennai, Tamil Nadu, India',
      image_url: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&q=80&w=800',
      ai_confidence_score: 91,
      ai_detected_tags: ['Pedestrian Zone', 'Urban Planting', 'Misting Canopy'],
      status_history: [
        { status: 'submitted', updatedBy: 'Priya Raman', role: 'citizen', timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
        { status: 'verified', updatedBy: 'Kavitha S.', role: 'moderator', timestamp: new Date(Date.now() - 1 * 86400000).toISOString(), note: 'Verified urban development proposal.' }
      ],
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 'idea-chennai-4',
      user_id: citizenUser.id,
      title: 'OMR IT Corridor Solar Bike Highway & E-Scooter Docks',
      description: 'Build a dedicated covered bicycle & electric scooter corridor along Old Mahabalipuram Road (OMR) connecting tech parks and student housing.',
      category: 'Transport',
      severity: 'high',
      status: 'under_review',
      department_assigned: 'Traffic & Transit',
      latitude: 12.9719,
      longitude: 80.2464,
      address: 'OMR IT Expressway, Perungudi, Chennai, India',
      image_url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=800',
      ai_confidence_score: 96,
      ai_detected_tags: ['Bicycle Track', 'Traffic Safety', 'Commuter Lane'],
      status_history: [
        { status: 'submitted', updatedBy: 'Aravind Kumar', role: 'citizen', timestamp: new Date(Date.now() - 1 * 86400000).toISOString() },
        { status: 'under_review', updatedBy: 'Eng. Rajesh V.', role: 'official', timestamp: new Date(Date.now() - 12 * 3600000).toISOString(), note: 'Reviewing feasibility with Chennai Smart City Corp.' }
      ],
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 12 * 3600000).toISOString()
    },
    {
      id: 'idea-chennai-5',
      user_id: adminUser.id,
      title: 'Nungambakkam High Road Dangerous Pothole & Drainage Clog',
      description: 'Deep road cave-in and clogged monsoon drain near college crossing causing severe traffic hazards and water logging during rain.',
      category: 'Roads & Potholes',
      severity: 'critical',
      status: 'assigned',
      department_assigned: 'Public Works & Roads',
      assigned_official_name: 'Eng. Rajesh V.',
      latitude: 13.0604,
      longitude: 80.2407,
      address: 'Nungambakkam High Road, Chennai, Tamil Nadu, India',
      image_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800',
      ai_confidence_score: 99,
      ai_detected_tags: ['Pothole Hazard', 'Drainage Defect', 'High Traffic Hazard'],
      status_history: [
        { status: 'submitted', updatedBy: 'Dr. Meenakshi Sundaram', role: 'admin', timestamp: new Date(Date.now() - 12 * 3600000).toISOString() },
        { status: 'assigned', updatedBy: 'Kavitha S.', role: 'moderator', timestamp: new Date(Date.now() - 6 * 3600000).toISOString(), note: 'Critical severity flagged; assigned to Highways Dept.' }
      ],
      created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
      updated_at: new Date(Date.now() - 6 * 3600000).toISOString()
    },
    {
      id: 'idea-chennai-6',
      user_id: user2.id,
      title: 'Adyar River Park Water Quality Sensor Network & Kayak Deck',
      description: 'Install real-time water quality IoT monitors and a community eco-kayaking launch deck along the restored Adyar River estuary.',
      category: 'Water & Drainage',
      severity: 'low',
      status: 'resolved',
      department_assigned: 'Environmental Protection',
      assigned_official_name: 'Eng. Rajesh V.',
      resolution_notes: 'IoT water quality probes installed successfully. Live water parameters connected to Chennai Civic Dashboard.',
      resolution_image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800',
      latitude: 13.0067,
      longitude: 80.2572,
      address: 'Adyar Eco Park, Kotturpuram, Chennai, Tamil Nadu, India',
      image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800',
      ai_confidence_score: 95,
      ai_detected_tags: ['IoT Sensor', 'River Restoration', 'Water Quality'],
      status_history: [
        { status: 'submitted', updatedBy: 'Priya Raman', role: 'citizen', timestamp: new Date(Date.now() - 10 * 86400000).toISOString() },
        { status: 'assigned', updatedBy: 'Eng. Rajesh V.', role: 'official', timestamp: new Date(Date.now() - 8 * 86400000).toISOString() },
        { status: 'in_progress', updatedBy: 'Eng. Rajesh V.', role: 'official', timestamp: new Date(Date.now() - 4 * 86400000).toISOString() },
        { status: 'resolved', updatedBy: 'Eng. Rajesh V.', role: 'official', timestamp: new Date(Date.now() - 1 * 86400000).toISOString(), note: 'Installation verified complete.' }
      ],
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString()
    }
  ];

  const seedLikes: LikeDB[] = [
    { id: 'l1', idea_id: 'idea-chennai-1', user_id: adminUser.id, created_at: now },
    { id: 'l2', idea_id: 'idea-chennai-1', user_id: user2.id, created_at: now },
    { id: 'l3', idea_id: 'idea-chennai-2', user_id: citizenUser.id, created_at: now },
    { id: 'l4', idea_id: 'idea-chennai-3', user_id: citizenUser.id, created_at: now },
    { id: 'l5', idea_id: 'idea-chennai-4', user_id: adminUser.id, created_at: now },
    { id: 'l6', idea_id: 'idea-chennai-5', user_id: officialUser.id, created_at: now }
  ];

  const seedVerifications: VerificationDB[] = [
    { id: 'v1', idea_id: 'idea-chennai-1', user_id: officialUser.id, comment: 'Confirmed location and public requirement.', created_at: now },
    { id: 'v2', idea_id: 'idea-chennai-1', user_id: user2.id, comment: 'I visit Marina beach daily and can confirm plastic build-up.', created_at: now },
    { id: 'v3', idea_id: 'idea-chennai-3', user_id: moderatorUser.id, comment: 'Verified pedestrian congestion in Pondy Bazaar.', created_at: now },
    { id: 'v4', idea_id: 'idea-chennai-5', user_id: citizenUser.id, comment: 'Hazardous deep pothole verified in person.', created_at: now }
  ];

  const seedComments: CommentDB[] = [
    {
      id: 'c1',
      idea_id: 'idea-chennai-1',
      user_id: adminUser.id,
      text: 'Approved from Smart City committee! The Marina beach site receives excellent solar irradiance.',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'c2',
      idea_id: 'idea-chennai-2',
      user_id: citizenUser.id,
      text: 'As an Anna University student, this would save so much travel time between Guindy campus gates!',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 'c3',
      idea_id: 'idea-chennai-5',
      user_id: officialUser.id,
      text: 'Highways work order created (#GCC-2026-889). Emergency road patching crew scheduled.',
      created_at: new Date(Date.now() - 4 * 3600000).toISOString()
    }
  ];

  return {
    users: [citizenUser, adminUser, officialUser, moderatorUser, user2],
    ideas: seedIdeas,
    comments: seedComments,
    likes: seedLikes,
    verifications: seedVerifications
  };
}

class LocalDBStore {
  private data: DataStoreSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DataStoreSchema {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.ideas && parsed.comments && parsed.likes) {
          if (!parsed.verifications) parsed.verifications = [];
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed reading DB file, re-initializing:', e);
    }
    const seed = getSeedData();
    this.saveData(seed);
    return seed;
  }

  private saveData(data: DataStoreSchema) {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed writing DB file:', e);
    }
  }

  public get users() { return this.data.users; }
  public get ideas() { return this.data.ideas; }
  public get comments() { return this.data.comments; }
  public get likes() { return this.data.likes; }
  public get verifications() { return this.data.verifications; }

  public persist() {
    this.saveData(this.data);
  }
}

export const localDB = new LocalDBStore();

// Haversine Formula for distance calculation in kilometers
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

