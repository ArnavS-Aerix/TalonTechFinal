/*
# Add comments column to sponsors table

## Purpose
Lets the admin attach an optional comment/note to each sponsor (e.g. "Gold tier - $5000/year").
The comment is stored in the database but not displayed on the public site.

## 1. Modified Table: sponsors
- Added `comments` column (text, nullable) for admin-only notes

## 2. Security
- No policy changes needed — existing CRUD policies already cover the new column
*/

ALTER TABLE public.sponsors
  ADD COLUMN IF NOT EXISTS comments text;
