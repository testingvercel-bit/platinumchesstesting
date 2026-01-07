# Implementation Plan: Admin Dashboard & Tournament System (Refined)

## 1. Database Schema (Supabase)
I will provide the SQL commands to run in your Supabase SQL Editor.
*   **Update `profiles`**: Add `is_admin` column.
*   **Create `tournaments`**: Name, prize, start date, rules, lichess link.
*   **Create `tournament_participants`**: 
    *   `id`, `tournament_id`, `user_id`, `lichess_username`, `joined_at`.
    *   This enables admins to track who joined.

## 2. Admin Dashboard (`/admin`)
*   **Route**: `app/admin/page.tsx` (Protected).
*   **User Management Tab**:
    *   List users with search/filter.
    *   **Actions**: Add/Deduct Balance, Ban/Delete.
*   **Tournament Management Tab**:
    *   Create/Edit Tournaments.
    *   **View Participants**: A dedicated view to see the list of users (and their Lichess usernames) who joined a specific tournament.

## 3. User-Facing Tournament Features
*   **Tournament Banner**:
    *   Displays upcoming tournament on Home page.
    *   Countdown & Prize Fund.
*   **Tournament Details Page (`/tournaments/[id]`)**:
    *   **Eligibility Check**: 
        *   **Requirement**: User must have at least **$5 USD** in their account to join.
        *   **UI Feedback**: If balance < $5, show a clear message ("Insufficient funds to join") and disable the button or redirect to deposit.
    *   **Join Flow**:
        *   If eligible: Click "Join" -> Enter Lichess Username -> Save to `tournament_participants` -> Redirect to Lichess.

## 4. UI/UX & Styling
*   **Theme**: Dark mode, glassmorphism, "Apple-style" aesthetics.
*   **Components**: Consistent use of rounded corners, blur effects, and emerald accents for financial data.

## 5. Implementation Steps
1.  **Define Types**: Update interfaces for Tournaments, Participants, and Profiles.
2.  **Create Admin Page**: Implement Users tab and Tournaments tab (with Participant viewer).
3.  **Implement Tournament Banner**: Add to Home page.
4.  **Create Tournament Details Page**: Implement logic for **$5 balance check** and the Lichess username submission flow.
5.  **Verify**: Test admin actions, balance restrictions, and join flow.
