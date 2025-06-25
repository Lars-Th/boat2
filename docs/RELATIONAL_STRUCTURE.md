# Relational Database Structure

## Overview

This document describes the new normalized relational structure for managing
offices (enheter), participants, and participant groups in the Stadsmissionen
system.

## Database Tables

### 1. offices.json

**Purpose**: Stores information about organizational offices/units (enheter)

**Structure**:

```json
{
  "OfficeID": number,      // Primary Key
  "Name": string,          // Office name (e.g., "Barn och unga")
  "Address": string,       // Street address
  "PostalCode": string,    // Postal code
  "City": string,          // City
  "Phone": string,         // Phone number
  "Email": string          // Email address
}
```

**Sample Data**:

- Barn och unga (OfficeID: 1)
- Familjecentral (OfficeID: 2)
- Vuxenverksamhet (OfficeID: 3)
- Ekonomisk rådgivning (OfficeID: 4)
- Språkstöd (OfficeID: 5)
- Fritidsgård (OfficeID: 6)
- Boendestöd (OfficeID: 7)
- Arbetsträning (OfficeID: 8)

### 2. participantGroups.json (Updated)

**Purpose**: Stores participant group information without direct participant
references

**Changes Made**:

- ✅ **REMOVED**: `deltagare` array (direct participant references)
- ✅ **KEPT**: All other group metadata

**Structure**:

```json
{
  "id": string,            // Primary Key
  "namn": string,          // Group name
  "beskrivning": string,   // Description
  "enheter": string[],     // Office names (for reference)
  "isAutomatic": boolean,  // Whether group is automatically managed
  "automatiskregel": string|null, // Automatic rule if applicable
  "skapadDatum": string,   // Creation date
  "skapadAv": string,      // Created by
  "aktiv": boolean         // Active status
}
```

### 3. participants.json (Unchanged)

**Purpose**: Stores participant information

- Maintains existing `Enheter` array for backward compatibility
- Will eventually be normalized through junction table

### 4. enheterParticipantsGroups.json (NEW)

**Purpose**: Junction table linking offices, participants, and participant
groups

**Structure**:

```json
{
  "JunctionID": number,           // Primary Key
  "OfficeID": number,             // Foreign Key → offices.OfficeID
  "ParticipantID": number,        // Foreign Key → participants.ParticipantID
  "ParticipantGroupID": string|null // Foreign Key → participantGroups.id (null if not in group)
}
```

## Relationships

### Many-to-Many Relationships

1. **Participants ↔ Offices**: A participant can belong to multiple offices,
   and an office can have multiple participants
2. **Participants ↔ Groups**: A participant can belong to multiple groups, and
   a group can have multiple participants
3. **Offices ↔ Groups**: A group can be associated with multiple offices, and
   an office can have multiple groups

### Junction Table Logic

- **JunctionID**: Unique identifier for each relationship
- **OfficeID**: Links to the office table
- **ParticipantID**: Links to the participant
- **ParticipantGroupID**: Links to the group (can be null if participant is in
  office but not in any group)

## Query Examples

### Get all participants in a specific office:

```sql
SELECT p.* FROM participants p
JOIN enheterParticipantsGroups j ON p.ParticipantID = j.ParticipantID
WHERE j.OfficeID = 1  -- Barn och unga
```

### Get all participants in a specific group:

```sql
SELECT p.* FROM participants p
JOIN enheterParticipantsGroups j ON p.ParticipantID = j.ParticipantID
WHERE j.ParticipantGroupID = 'group-1'
```

### Get all offices for a participant:

```sql
SELECT o.* FROM offices o
JOIN enheterParticipantsGroups j ON o.OfficeID = j.OfficeID
WHERE j.ParticipantID = 1
```

### Get all groups for a participant:

```sql
SELECT pg.* FROM participantGroups pg
JOIN enheterParticipantsGroups j ON pg.id = j.ParticipantGroupID
WHERE j.ParticipantID = 1 AND j.ParticipantGroupID IS NOT NULL
```

## Migration Notes

### What Changed:

1. **Created** `offices.json` with 8 office records
2. **Created** `enheterParticipantsGroups.json` with 39 junction records
3. **Updated** `participantGroups.json` by removing `deltagare` arrays
4. **Preserved** existing `participants.json` structure

### Data Integrity:

- All existing participant-group relationships have been preserved in the
  junction table
- All office associations have been maintained
- No data loss occurred during normalization

### Benefits:

- ✅ Proper normalized database structure
- ✅ Eliminates data duplication
- ✅ Enables complex queries and relationships
- ✅ Supports many-to-many relationships properly
- ✅ Easier to maintain and update
- ✅ Better performance for large datasets

### API Integration:

The mock data service and API endpoints will need to be updated to:

1. Handle junction table queries
2. Resolve relationships dynamically
3. Support filtering by office, group, or participant combinations
