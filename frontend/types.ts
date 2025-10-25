import React from 'react';

export interface User {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name: string;
  company: string | null;
  blog: string;
  location: string;
  email: string | null;
  hireable: boolean | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
  initials?: string;
  role?: 'user' | 'admin';
}

export interface SoftwareComponent {
  id: string;
  name: string;
  description: string;
  owner: string;
  type: string;
  lifecycle: string;
  githubUrl: string;
  terraformRunId?: string;
  terraformStatus?: string;
  terraformError?: string;
  isDestroying?: boolean;
  workspaceName?: string;
  createdAt?: string;
}

export interface SoftwareTemplate {
  id: string;
  name:string;
  description: string;
  icon: React.ReactNode;
  tags: string[];
  type: string;
}