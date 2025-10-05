# 데이터 모델 PRD

## 1. 개요

PostgreSQL 데이터베이스 스키마 정의

## 2. 주요 테이블

### 2.1 Users (사용자)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  profile_image TEXT,
  auth_provider VARCHAR(20) DEFAULT 'email',
  email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

### 2.2 Places (장소)
```sql
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(50),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  category VARCHAR(50) NOT NULL,
  custom_category VARCHAR(50),
  labels TEXT[], -- 배열
  visited BOOLEAN DEFAULT FALSE,
  visited_at TIMESTAMP,
  visit_note TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  estimated_cost INTEGER,
  photos TEXT[], -- 이미지 URL 배열
  external_url TEXT,
  external_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_places_user_id ON places(user_id);
CREATE INDEX idx_places_category ON places(category);
CREATE INDEX idx_places_visited ON places(visited);
CREATE INDEX idx_places_name ON places USING GIN (to_tsvector('simple', name));
CREATE INDEX idx_places_address ON places USING GIN (to_tsvector('simple', address));
```

### 2.3 Lists (목록)
```sql
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  icon_type VARCHAR(10) CHECK (icon_type IN ('emoji', 'image')),
  icon_value TEXT NOT NULL,
  color_theme VARCHAR(7),
  is_public BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lists_user_id ON lists(user_id);
```

### 2.4 Place_Lists (장소-목록 연결)
```sql
CREATE TABLE place_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  "order" INTEGER DEFAULT 0,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(place_id, list_id)
);

CREATE INDEX idx_place_lists_place_id ON place_lists(place_id);
CREATE INDEX idx_place_lists_list_id ON place_lists(list_id);
```

### 2.5 Categories (카테고리)
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL = 기본 카테고리
  name VARCHAR(20) NOT NULL,
  color VARCHAR(7) NOT NULL,
  icon VARCHAR(50),
  is_custom BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_categories_user_id ON categories(user_id);
```

### 2.6 Email_Verifications (이메일 인증)
```sql
CREATE TABLE email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_verifications_token ON email_verifications(token);
```

### 2.7 Password_Resets (비밀번호 재설정)
```sql
CREATE TABLE password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_password_resets_token ON password_resets(token);
```

### 2.8 Refresh_Tokens (리프레시 토큰)
```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
```

### 2.9 Login_Attempts (로그인 시도)
```sql
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  success BOOLEAN DEFAULT FALSE,
  attempted_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address);
```

## 3. TypeScript 인터페이스

```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  nickname: string;
  profileImage?: string;
  authProvider: 'email' | 'google' | 'kakao' | 'apple';
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

interface Place {
  id: string;
  userId: string;
  name: string;
  address: string;
  phone?: string;
  latitude: number;
  longitude: number;
  category: string;
  customCategory?: string;
  labels: string[];
  visited: boolean;
  visitedAt?: Date;
  visitNote?: string;
  rating?: number;
  estimatedCost?: number;
  photos: string[];
  externalUrl?: string;
  externalId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface List {
  id: string;
  userId: string;
  name: string;
  description?: string;
  icon: {
    type: 'emoji' | 'image';
    value: string;
  };
  colorTheme?: string;
  isPublic: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PlaceList {
  id: string;
  placeId: string;
  listId: string;
  order: number;
  addedAt: Date;
}

interface Category {
  id: string;
  userId?: string;
  name: string;
  color: string;
  icon?: string;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## 4. 관계

```
users (1) ─── (N) places
users (1) ─── (N) lists
users (1) ─── (N) categories

places (N) ─── (N) lists (through place_lists)
```

## 5. 데이터 마이그레이션

- Prisma 또는 TypeORM 사용
- 버전 관리
- 롤백 지원
