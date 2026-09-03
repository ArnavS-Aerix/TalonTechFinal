/*
# Add placement column to sponsors table

## Purpose
Lets the admin choose where each sponsor appears on the homepage:
- "hero" = shown in the logo grid above the Team section
- "carousel" = shown in the rotating carousel (the existing one)

## 1. Modified Table: sponsors
- Added `placement` column (text, default 'carousel')
  - Valid values: 'hero', 'carousel'
  - Existing sponsors default to 'carousel' so nothing changes visually

## 2. Security
- No policy changes needed — existing CRUD policies already cover the new column
*/

ALTER TABLE public.sponsors
  ADD COLUMN IF NOT EXISTS placement text NOT NULL DEFAULT 'carousel';
