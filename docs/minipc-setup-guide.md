# Travel Planner - 미니PC 개발 서버 설정 가이드

미니PC를 개발 서버로 설정하는 완전한 가이드입니다.

## 📋 목차

1. [사전 요구사항](#사전-요구사항)
2. [초기 설정](#초기-설정)
3. [Docker 설치](#docker-설치)
4. [프로젝트 설정](#프로젝트-설정)
5. [GitHub Actions Runner 설정](#github-actions-runner-설정)
6. [Cloudflare Tunnel 설정](#cloudflare-tunnel-설정)
7. [보안 설정](#보안-설정)
8. [모니터링 설정](#모니터링-설정)

---

## 사전 요구사항

### 하드웨어

- **CPU**: Intel/AMD 2코어 이상
- **RAM**: 4GB 이상 (8GB 권장)
- **디스크**: 32GB 이상 (SSD 권장)
- **네트워크**: 유선 연결 권장

### 소프트웨어

- **OS**: Ubuntu 22.04 LTS (권장)
- **네트워크**: 고정 IP 또는 DDNS
- **SSH**: 외부 접근 가능

---

## 초기 설정

### 1. Ubuntu 설치 및 업데이트

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 필수 패키지 설치
sudo apt install -y \
  curl \
  wget \
  git \
  build-essential \
  software-properties-common \
  ca-certificates \
  gnupg \
  lsb-release
```

### 2. 사용자 계정 생성

```bash
# 배포 전용 사용자 생성
sudo adduser deploy

# sudo 권한 부여
sudo usermod -aG sudo deploy

# deploy 사용자로 전환
sudo su - deploy
```

### 3. SSH 설정

```bash
# SSH 키 생성
ssh-keygen -t ed25519 -C "travel-planner-deploy"

# 공개키 확인
cat ~/.ssh/id_ed25519.pub

# GitHub에 공개키 등록
# Settings → SSH and GPG keys → New SSH key
```

**외부 SSH 접근 설정**:

```bash
# SSH 포트 변경 (보안 강화, 선택사항)
sudo nano /etc/ssh/sshd_config

# Port 22 → Port 2222 변경
# PermitRootLogin no
# PasswordAuthentication no (키 인증만 허용)

# SSH 재시작
sudo systemctl restart sshd
```

---

## Docker 설치

### 1. Docker Engine 설치

```bash
# Docker 공식 GPG 키 추가
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Docker 저장소 추가
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker 설치
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# deploy 사용자를 docker 그룹에 추가
sudo usermod -aG docker deploy

# 로그아웃 후 재로그인하여 그룹 변경 적용
exit
sudo su - deploy

# Docker 버전 확인
docker --version
docker compose version
```

### 2. Docker 자동 시작 설정

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

---

## 프로젝트 설정

### 1. 프로젝트 클론

```bash
# 홈 디렉토리에 프로젝트 클론
cd ~
git clone git@github.com:zerodice0/travel-planner.git
cd travel-planner

# develop 브랜치로 전환
git checkout develop
```

### 2. 환경 변수 설정

```bash
# API 환경 변수
cd apps/api
cp .env.example .env

# 환경 변수 편집
nano .env

# 필수 환경 변수 설정:
# - DATABASE_URL=file:./dev.db
# - R2_* (Cloudflare R2 설정)
# - GOOGLE_MAPS_API_KEY
```

### 3. Docker Compose 실행

```bash
cd ~/travel-planner

# 개발 환경 실행
docker-compose -f docker-compose.dev.yml up -d

# 로그 확인
docker-compose -f docker-compose.dev.yml logs -f

# Health Check
curl http://localhost:4000/api/health
```

---

## GitHub Actions Runner 설정

### Self-hosted Runner 설치

**1. GitHub Repository 설정**:

- Repository → Settings → Actions → Runners
- "New self-hosted runner" 클릭
- Linux 선택

**2. 미니PC에서 Runner 설치**:

```bash
# 홈 디렉토리에 actions-runner 폴더 생성
mkdir ~/actions-runner && cd ~/actions-runner

# Runner 다운로드 (GitHub에서 제공하는 최신 버전 사용)
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# 압축 해제
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Runner 설정
./config.sh --url https://github.com/zerodice0/travel-planner --token <YOUR_TOKEN>

# 이름: mini-pc-dev
# 레이블: self-hosted,Linux,X64
# 작업 폴더: _work
```

**3. Runner를 서비스로 실행**:

```bash
# 서비스 설치
sudo ./svc.sh install

# 서비스 시작
sudo ./svc.sh start

# 서비스 상태 확인
sudo ./svc.sh status

# 부팅 시 자동 시작
sudo systemctl enable actions.runner.zerodice0-travel-planner.mini-pc-dev.service
```

**4. Runner 동작 확인**:

- Repository → Settings → Actions → Runners
- "mini-pc-dev" 상태 확인 (Idle)

---

## Cloudflare Tunnel 설정

외부에서 개발 서버에 접근하기 위한 Cloudflare Tunnel 설정.

### 1. Cloudflared 설치

```bash
# Cloudflared 다운로드 및 설치
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# 버전 확인
cloudflared --version
```

### 2. Cloudflare 인증

```bash
# Cloudflare 로그인
cloudflared tunnel login

# 브라우저가 열리면 Cloudflare 계정으로 로그인
# 인증 파일이 ~/.cloudflared/cert.pem에 저장됨
```

### 3. Tunnel 생성

```bash
# Tunnel 생성
cloudflared tunnel create travel-planner-dev

# Tunnel ID 확인 (출력에서 복사)
# Tunnel credentials 파일 위치: ~/.cloudflared/<tunnel-id>.json
```

### 4. Tunnel 설정 파일 생성

```bash
# 설정 파일 생성
nano ~/.cloudflared/config.yml
```

**config.yml 내용**:

```yaml
tunnel: <tunnel-id>
credentials-file: /home/deploy/.cloudflared/<tunnel-id>.json

ingress:
  # API 서버
  - hostname: dev-api.yourdomain.com
    service: http://localhost:4000
  # 웹 서버
  - hostname: dev.yourdomain.com
    service: http://localhost:3000
  # 기본 라우트
  - service: http_status:404
```

### 5. DNS 레코드 설정

```bash
# API 서버 DNS
cloudflared tunnel route dns travel-planner-dev dev-api.yourdomain.com

# 웹 서버 DNS
cloudflared tunnel route dns travel-planner-dev dev.yourdomain.com
```

### 6. Tunnel 서비스 실행

```bash
# 서비스 설치
sudo cloudflared service install

# 서비스 시작
sudo systemctl start cloudflared

# 서비스 상태 확인
sudo systemctl status cloudflared

# 부팅 시 자동 시작
sudo systemctl enable cloudflared
```

### 7. 접속 테스트

```bash
# API 서버 접속
curl https://dev-api.yourdomain.com/api/health

# 웹 서버 접속
curl https://dev.yourdomain.com
```

---

## 보안 설정

### 1. UFW 방화벽 설정

```bash
# UFW 설치 및 활성화
sudo apt install -y ufw

# 기본 정책 설정 (외부 → 거부, 내부 → 허용)
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH 포트 허용 (포트 변경한 경우 해당 포트 사용)
sudo ufw allow 2222/tcp

# 방화벽 활성화
sudo ufw enable

# 상태 확인
sudo ufw status
```

### 2. Fail2ban 설정 (SSH 무차별 대입 공격 방지)

```bash
# Fail2ban 설치
sudo apt install -y fail2ban

# 설정 파일 복사
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# SSH 보호 설정
sudo nano /etc/fail2ban/jail.local

# [sshd] 섹션에서:
# enabled = true
# port = 2222 (변경한 포트)
# maxretry = 3

# Fail2ban 재시작
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
```

### 3. 자동 보안 업데이트

```bash
# Unattended-upgrades 설치
sudo apt install -y unattended-upgrades

# 자동 업데이트 활성화
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 모니터링 설정

### 1. 시스템 모니터링

```bash
# htop 설치 (시스템 리소스 모니터링)
sudo apt install -y htop

# 실행
htop
```

### 2. Docker 로그 모니터링

```bash
# 개발 서버 로그 실시간 확인
cd ~/travel-planner
docker-compose -f docker-compose.dev.yml logs -f

# 특정 컨테이너 로그
docker-compose -f docker-compose.dev.yml logs -f dev-api
```

### 3. 디스크 사용량 모니터링

```bash
# 디스크 사용량 확인
df -h

# Docker 디스크 사용량
docker system df

# 사용하지 않는 Docker 리소스 정리
docker system prune -a --volumes
```

---

## 유지보수

### 정기 작업

**매주**:
- [ ] 디스크 사용량 확인
- [ ] Docker 로그 확인
- [ ] 시스템 업데이트 확인

**매월**:
- [ ] Docker 이미지 정리
- [ ] SSH 키 검토
- [ ] 보안 업데이트 적용

### 백업

```bash
# 데이터베이스 백업
cd ~/travel-planner/apps/api
cp prisma/dev.db ~/backups/dev.db.$(date +%Y%m%d)

# 환경 변수 백업
cp .env ~/backups/.env.$(date +%Y%m%d)
```

---

## 트러블슈팅

### 문제 1: Docker 컨테이너 시작 실패

```bash
# 로그 확인
docker-compose -f docker-compose.dev.yml logs

# 컨테이너 재시작
docker-compose -f docker-compose.dev.yml restart

# 완전 재빌드
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d --build
```

### 문제 2: Cloudflare Tunnel 연결 끊김

```bash
# Cloudflared 상태 확인
sudo systemctl status cloudflared

# Cloudflared 재시작
sudo systemctl restart cloudflared

# 로그 확인
sudo journalctl -u cloudflared -f
```

### 문제 3: GitHub Actions Runner 오프라인

```bash
# Runner 상태 확인
sudo systemctl status actions.runner.*.service

# Runner 재시작
sudo systemctl restart actions.runner.*.service

# 로그 확인
sudo journalctl -u actions.runner.*.service -f
```

---

## 추가 리소스

- [배포 가이드](./deployment-guide.md)
- [Docker 가이드](./docker-guide.md)
- [GitHub Actions 문서](https://docs.github.com/en/actions/hosting-your-own-runners)
- [Cloudflare Tunnel 문서](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)

---

**마지막 업데이트**: 2025-10-22
