/**
 * App configuration. Secrets come from the environment — see .env.example.
 */

export const CONFIG = {
  MONGODB_URI: process.env.MONGODB_URI || '',
  CLOUDINARY_URL: process.env.CLOUDINARY_URL || '',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
};

// Fundraiser categories — shared by the create API and the forms.
export const FUNDRAISER_CATEGORIES = [
  'Medical', 'Education', 'Community', 'Emergency', 'Animal Welfare', 'Environmental',
  'Arts & Culture', 'Technology', 'Sports', 'Religious', 'Memorial', 'Business', 'Personal', 'Other',
] as const;

export type FundraiserCategory = (typeof FUNDRAISER_CATEGORIES)[number];
