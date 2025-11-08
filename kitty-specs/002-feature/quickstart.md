# Quickstart Guide: 장소 추가 및 장소 데이터 검증

**Feature**: 002-feature
**Updated**: 2025-11-04
**Prerequisites**: Node.js 18+, pnpm, Cloudflare D1 database

## Overview

This guide helps you implement the user-generated place validation system in 30 minutes or less. Follow these steps to get the core functionality working.

## Quick Links

- **Spec**: [spec.md](spec.md)
- **Research**: [research.md](research.md)
- **Data Model**: [data-model.md](data-model.md)
- **API Contracts**: [contracts/places-api.yaml](contracts/places-api.yaml)

## Prerequisites Check

```bash
# Verify Node.js version
node --version  # Should be 18+

# Verify pnpm
pnpm --version

# Verify Cloudflare CLI (if using D1 locally)
wrangler --version

# Check current branch
git branch --show-current  # Should be 002-feature
```

## Step 1: Install Dependencies (2 minutes)

```bash
# Backend dependencies
cd apps/backend
pnpm add geolib@^3.3.4 fastest-levenshtein@^1.0.16

# (Optional) Profanity filter - choose one after testing:
# pnpm add bad-words
# pnpm add profanity-js

# Frontend dependencies (if any new libraries needed)
cd ../web
# pnpm add <library>  # None required for Phase 1
```

## Step 2: Database Migration (5 minutes)

### 2.1 Update Prisma Schema

Edit `apps/backend/prisma/schema.prisma`:

```prisma
model Place {
  id          String   @id @default(cuid())
  externalId  String?  @unique  // ← CHANGE: Make optional
  name        String
  address     String
  latitude    Float
  longitude   Float
  category    String?
  description String?
  phoneNumber String?
  website     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  userPlaces      UserPlace[]
  moderationQueue PlaceModerationQueue?  // ← NEW

  @@index([latitude, longitude], name: "spatial_index")  // ← NEW
  @@index([externalId])
}

model UserPlace {
  id            String    @id @default(cuid())
  userId        String
  placeId       String
  customName    String?
  label         String?
  notes         String?
  visited       Boolean   @default(false)
  visitDate     DateTime?
  visitNotes    String?
  rating        Float?
  estimatedCost Float?
  photos        String[]  @default([])
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  place Place @relation(fields: [placeId], references: [id], onDelete: Cascade)

  @@unique([userId, placeId])
  @@index([userId])
  @@index([createdAt], name: "rate_limit_index")  // ← NEW
}

// ← NEW: Add entire model
model PlaceModerationQueue {
  id          String   @id @default(cuid())
  placeId     String   @unique
  userId      String
  status      String   @default("pending")
  reviewerId  String?
  reviewedAt  DateTime?
  reviewNotes String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  place    Place @relation(fields: [placeId], references: [id], onDelete: Cascade)
  user     User  @relation(fields: [userId], references: [id], onDelete: Cascade, name: "creator")
  reviewer User? @relation(fields: [reviewerId], references: [id], onDelete: SetNull, name: "reviewer")

  @@index([status])
  @@index([createdAt])
}

// ← UPDATE: Add relations to User model
model User {
  // ... existing fields ...
  createdPlaces   PlaceModerationQueue[] @relation("creator")
  reviewedPlaces  PlaceModerationQueue[] @relation("reviewer")
}
```

### 2.2 Generate and Apply Migration

```bash
cd apps/backend

# Generate migration
npx prisma migrate dev --name add_place_validation_system

# If using Cloudflare D1 in production:
npx prisma migrate deploy
wrangler d1 migrations apply <database-name>
```

## Step 3: Backend Implementation (15 minutes)

### 3.1 Create Validation Pipe

**File**: `apps/backend/src/common/pipes/profanity-filter.pipe.ts`

```typescript
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
// import badWords from 'bad-words';  // Choose library after testing

@Injectable()
export class ProfanityFilterPipe implements PipeTransform {
  // private filter = new badWords();  // Initialize filter

  transform(value: any) {
    if (value && typeof value === 'object') {
      // Check name field
      if (value.name && this.containsProfanity(value.name)) {
        throw new BadRequestException('Place name contains inappropriate content');
      }

      // Check description field
      if (value.description && this.containsProfanity(value.description)) {
        throw new BadRequestException('Description contains inappropriate content');
      }
    }
    return value;
  }

  private containsProfanity(text: string): boolean {
    // TODO: Implement after choosing profanity library
    // return this.filter.isProfane(text);
    return false;  // Placeholder
  }
}
```

### 3.2 Create Rate Limit Guard

**File**: `apps/backend/src/common/guards/rate-limit.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      return true;  // Let auth guard handle this
    }

    // Get today's date range (UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Count places created today
    const count = await this.prisma.userPlace.count({
      where: {
        userId,
        createdAt: {
          gte: today,
        },
      },
    });

    // Determine limit based on user status
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const limit = user?.isVerified ? 10 : 5;

    if (count >= limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Daily place creation limit exceeded (${count}/${limit} used)`,
          limit,
          used: count,
          resetsAt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
```

### 3.3 Update Places Service

**File**: `apps/backend/src/places/places.service.ts`

```typescript
import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { getDistance } from 'geolib';
import { distance as levenshteinDistance } from 'fastest-levenshtein';

@Injectable()
export class PlacesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createPlaceDto: CreatePlaceDto) {
    // 1. Check for duplicates
    const duplicates = await this.detectDuplicates(
      createPlaceDto.name,
      createPlaceDto.latitude,
      createPlaceDto.longitude,
    );

    if (duplicates.length > 0) {
      throw new ConflictException({
        message: 'Duplicate place detected',
        duplicates: duplicates.map(p => ({
          id: p.id,
          name: p.name,
          address: p.address,
          distance: p.distance,
          similarity: p.similarity,
        })),
      });
    }

    // 2. Create Place
    const place = await this.prisma.place.create({
      data: {
        name: createPlaceDto.name,
        address: createPlaceDto.address,
        latitude: createPlaceDto.latitude,
        longitude: createPlaceDto.longitude,
        category: createPlaceDto.category,
        description: createPlaceDto.description,
        phoneNumber: createPlaceDto.phoneNumber,
        website: createPlaceDto.website,
      },
    });

    // 3. Create UserPlace
    const userPlace = await this.prisma.userPlace.create({
      data: {
        userId,
        placeId: place.id,
      },
      include: {
        place: true,
      },
    });

    // 4. Add to moderation queue
    await this.prisma.placeModerationQueue.create({
      data: {
        placeId: place.id,
        userId,
        status: 'pending',
      },
    });

    return {
      ...userPlace,
      moderationStatus: 'pending',
    };
  }

  private async detectDuplicates(name: string, lat: number, lng: number) {
    // Bounding box (±0.001 degrees ≈ 100m)
    const candidates = await this.prisma.place.findMany({
      where: {
        latitude: {
          gte: lat - 0.001,
          lte: lat + 0.001,
        },
        longitude: {
          gte: lng - 0.001,
          lte: lng + 0.001,
        },
      },
    });

    // Filter by Haversine + Levenshtein
    const duplicates = candidates.filter(place => {
      // Distance check
      const distanceMeters = getDistance(
        { lat, lng },
        { lat: place.latitude, lng: place.longitude },
      );

      // Similarity check
      const maxLength = Math.max(name.length, place.name.length);
      const similarity = 1 - (levenshteinDistance(name, place.name) / maxLength);

      return distanceMeters <= 100 && similarity >= 0.8;
    }).map(place => ({
      ...place,
      distance: getDistance({ lat, lng }, { lat: place.latitude, lng: place.longitude }),
      similarity: 1 - (levenshteinDistance(name, place.name) / Math.max(name.length, place.name.length)),
    }));

    return duplicates;
  }
}
```

### 3.4 Update Places Controller

**File**: `apps/backend/src/places/places.controller.ts`

```typescript
import { Controller, Post, Body, UseGuards, UsePipes, Get, Request } from '@nestjs/common';
import { PlacesService } from './places.service';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import { ProfanityFilterPipe } from '../common/pipes/profanity-filter.pipe';
import { CreatePlaceDto } from './dto/create-place.dto';

@Controller('places')
export class PlacesController {
  constructor(private placesService: PlacesService) {}

  @Post()
  @UseGuards(RateLimitGuard)
  @UsePipes(ProfanityFilterPipe)
  async create(@Request() req, @Body() createPlaceDto: CreatePlaceDto) {
    return this.placesService.create(req.user.id, createPlaceDto);
  }

  @Post('validate-duplicate')
  async validateDuplicate(@Body() dto: { name: string; latitude: number; longitude: number }) {
    const duplicates = await this.placesService['detectDuplicates'](dto.name, dto.latitude, dto.longitude);
    return {
      hasDuplicates: duplicates.length > 0,
      duplicates,
    };
  }

  @Get('rate-limit-status')
  async getRateLimitStatus(@Request() req) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const count = await this.prisma.userPlace.count({
      where: {
        userId: req.user.id,
        createdAt: { gte: today },
      },
    });

    const user = await this.prisma.user.findUnique({ where: { id: req.user.id } });
    const limit = user?.isVerified ? 10 : 5;

    return {
      limit,
      used: count,
      remaining: Math.max(0, limit - count),
      resetsAt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    };
  }
}
```

## Step 4: Admin Moderation Backend (5 minutes)

**File**: `apps/backend/src/admin/admin.controller.ts`

```typescript
import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard';
import { PrismaService } from '../common/prisma/prisma.service';

@Controller('admin/moderation')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getQueue(
    @Query('status') status: string = 'pending',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.placeModerationQueue.findMany({
        where: { status },
        include: {
          place: true,
          user: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.placeModerationQueue.count({ where: { status } }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Patch(':id')
  async review(
    @Param('id') id: string,
    @Body() dto: { status: 'approved' | 'rejected'; reviewNotes?: string },
    @Request() req,
  ) {
    return this.prisma.placeModerationQueue.update({
      where: { id },
      data: {
        status: dto.status,
        reviewerId: req.user.id,
        reviewedAt: new Date(),
        reviewNotes: dto.reviewNotes,
      },
      include: {
        place: true,
        user: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true } },
      },
    });
  }
}
```

## Step 5: Frontend Implementation (5 minutes)

### 5.1 Create Place Addition Form Component

**File**: `apps/web/src/pages/MapPage.tsx` (add to existing file)

```typescript
// Add these state variables
const [isAddingPlace, setIsAddingPlace] = useState(false);
const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);

// Map click handler
const handleMapClick = (event: google.maps.MapMouseEvent) => {
  if (isAddingPlace && event.latLng) {
    setSelectedCoords({
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    });
    setShowPlaceForm(true);
  }
};

// Place submission
const handleSubmitPlace = async (data: PlaceFormData) => {
  try {
    // 1. Check duplicates
    const dupCheck = await placesApi.validateDuplicate({
      name: data.name,
      latitude: selectedCoords!.lat,
      longitude: selectedCoords!.lng,
    });

    if (dupCheck.hasDuplicates) {
      setDuplicateWarning(dupCheck.duplicates);
      return;
    }

    // 2. Create place
    await placesApi.create({
      ...data,
      latitude: selectedCoords!.lat,
      longitude: selectedCoords!.lng,
    });

    toast.success('장소가 추가되었습니다. 검토 후 승인됩니다.');
    setShowPlaceForm(false);
    setIsAddingPlace(false);
    await loadPlaces();
  } catch (error: any) {
    if (error.status === 429) {
      toast.error(`일일 추가 한도 초과 (${error.data.used}/${error.data.limit})`);
    } else {
      toast.error('장소 추가 실패');
    }
  }
};
```

### 5.2 Create Admin Moderation Page

**File**: `apps/web/src/pages/AdminModerationPage.tsx`

```typescript
export function AdminModerationPage() {
  const [queue, setQueue] = useState<ModerationItem[]>([]);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    loadQueue();
  }, [status]);

  const loadQueue = async () => {
    const response = await fetch(`/api/admin/moderation?status=${status}`);
    const data = await response.json();
    setQueue(data.items);
  };

  const handleReview = async (id: string, newStatus: 'approved' | 'rejected', notes?: string) => {
    await fetch(`/api/admin/moderation/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, reviewNotes: notes }),
    });
    await loadQueue();
    toast.success(newStatus === 'approved' ? '승인되었습니다' : '거부되었습니다');
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">장소 검토</h1>

      {/* Status filter tabs */}
      <div className="mb-4">
        {['pending', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setStatus(s as any)}
            className={status === s ? 'active' : ''}
          >
            {s === 'pending' ? '대기중' : s === 'approved' ? '승인됨' : '거부됨'}
          </button>
        ))}
      </div>

      {/* Queue list */}
      {queue.map(item => (
        <div key={item.id} className="border p-4 mb-2">
          <h3>{item.place.name}</h3>
          <p>{item.place.address}</p>
          <p>Created by: {item.creator.name}</p>

          {status === 'pending' && (
            <div className="mt-2">
              <button onClick={() => handleReview(item.id, 'approved')}>
                승인
              </button>
              <button onClick={() => {
                const notes = prompt('거부 사유:');
                if (notes) handleReview(item.id, 'rejected', notes);
              }}>
                거부
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Step 6: Testing (3 minutes)

### 6.1 Test Place Creation

```bash
# Test duplicate detection
curl -X POST http://localhost:4000/api/places/validate-duplicate \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Place","latitude":37.5665,"longitude":126.9780}'

# Test place creation
curl -X POST http://localhost:4000/api/places \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Restaurant",
    "address": "123 Test St",
    "latitude": 37.5665,
    "longitude": 126.9780,
    "category": "restaurant"
  }'

# Test rate limit
# (repeat above 6 times to trigger limit)
```

### 6.2 Test Admin Moderation

```bash
# Get pending queue
curl http://localhost:4000/api/admin/moderation?status=pending \
  -H "Authorization: Bearer <admin-token>"

# Approve place
curl -X PATCH http://localhost:4000/api/admin/moderation/<queue-id> \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved"}'
```

## Troubleshooting

### Common Issues

**Issue**: "externalId cannot be null"
- **Solution**: Run migrations to make externalId optional

**Issue**: Rate limiting not working
- **Solution**: Check that createdAt index exists on UserPlace table

**Issue**: Duplicate detection too sensitive/insensitive
- **Solution**: Tune similarity threshold in PlacesService (currently 0.8)

**Issue**: Admin page showing 403 Forbidden
- **Solution**: Verify user.isAdmin = true in database

## Next Steps

1. ✅ Phase 1 Complete - Core validation system working
2. 📋 Phase 2 - Implement UserReputation system
3. 📋 Phase 3 - Add advanced moderation features
4. 📋 Phase 4 - Community reporting
5. 📋 Phase 5 - AI validation & gamification

## Support

- **Spec Questions**: See [spec.md](spec.md)
- **Technical Details**: See [research.md](research.md)
- **API Reference**: See [contracts/places-api.yaml](contracts/places-api.yaml)
- **Data Model**: See [data-model.md](data-model.md)

---

**Last Updated**: 2025-11-04
**Estimated Time**: 30 minutes
**Difficulty**: Medium
