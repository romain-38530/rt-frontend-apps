# Script pour créer et déployer toutes les APIs backend
param(
    [string]$MongoDBUri = "mongodb+srv://rt_admin:RtAdmin2024@stagingrt.v2jnoh2.mongodb.net"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Création et déploiement des APIs" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Définir toutes les APIs à créer
$apis = @(
    @{
        name = "api-planning"
        port = 3020
        db = "rt-planning"
        description = "RT Technologie Planning API"
        model = "Planning"
        routes = @{
            list = "GET /api/v1/planning"
            create = "POST /api/v1/planning"
            get = "GET /api/v1/planning/:id"
            update = "PUT /api/v1/planning/:id"
            delete = "DELETE /api/v1/planning/:id"
        }
        schema = @{
            title = "String, required"
            startDate = "Date, required"
            endDate = "Date, required"
            assignedTo = "String"
            status = "String, enum: ['planned', 'in-progress', 'completed', 'cancelled']"
        }
    },
    @{
        name = "api-ecmr"
        port = 3040
        db = "rt-ecmr"
        description = "RT Technologie eCMR API"
        model = "ECMR"
        routes = @{
            list = "GET /api/v1/ecmr"
            create = "POST /api/v1/ecmr"
            get = "GET /api/v1/ecmr/:id"
            update = "PUT /api/v1/ecmr/:id"
            delete = "DELETE /api/v1/ecmr/:id"
        }
        schema = @{
            documentNumber = "String, required, unique"
            carrier = "String, required"
            sender = "String, required"
            receiver = "String, required"
            goods = "String"
            status = "String, enum: ['draft', 'signed', 'delivered']"
        }
    },
    @{
        name = "api-palettes"
        port = 3050
        db = "rt-palettes"
        description = "RT Technologie Palettes API"
        model = "Palette"
        routes = @{
            list = "GET /api/v1/palettes"
            create = "POST /api/v1/palettes"
            get = "GET /api/v1/palettes/:id"
            update = "PUT /api/v1/palettes/:id"
            delete = "DELETE /api/v1/palettes/:id"
        }
        schema = @{
            paletteId = "String, required, unique"
            type = "String, required"
            quantity = "Number, required"
            location = "String"
            status = "String, enum: ['available', 'in-use', 'damaged', 'lost']"
        }
    },
    @{
        name = "api-storage"
        port = 3060
        db = "rt-storage"
        description = "RT Technologie Storage Market API"
        model = "Storage"
        routes = @{
            list = "GET /api/v1/storage"
            create = "POST /api/v1/storage"
            get = "GET /api/v1/storage/:id"
            update = "PUT /api/v1/storage/:id"
            delete = "DELETE /api/v1/storage/:id"
        }
        schema = @{
            facilityName = "String, required"
            location = "String, required"
            capacity = "Number, required"
            availableSpace = "Number"
            pricePerUnit = "Number"
            status = "String, enum: ['active', 'full', 'maintenance']"
        }
    },
    @{
        name = "api-chatbot"
        port = 3070
        db = "rt-chatbot"
        description = "RT Technologie Chatbot API"
        model = "Message"
        routes = @{
            messages = "GET /api/v1/chatbot/messages"
            send = "POST /api/v1/chatbot/send"
            conversation = "GET /api/v1/chatbot/conversation/:id"
        }
        schema = @{
            conversationId = "String, required"
            sender = "String, required"
            message = "String, required"
            response = "String"
            timestamp = "Date, default: Date.now"
        }
    }
)

$corsOrigins = "https://main.dntbizetlc7bm.amplifyapp.com,https://main.dbg6okncuyyiw.amplifyapp.com,https://main.d1tb834u144p4r.amplifyapp.com,https://main.d3b6p09ihn5w7r.amplifyapp.com,https://main.dzvo8973zaqb.amplifyapp.com,https://main.d3hz3xvddrl94o.amplifyapp.com,https://main.d31p7m90ewg4xm.amplifyapp.com"

foreach ($api in $apis) {
    Write-Host "Création de $($api.name)..." -ForegroundColor Yellow

    $apiPath = "apps/$($api.name)"

    # Créer la structure
    New-Item -ItemType Directory -Force -Path "$apiPath/src/models" | Out-Null
    New-Item -ItemType Directory -Force -Path "$apiPath/src/routes" | Out-Null
    New-Item -ItemType Directory -Force -Path "$apiPath/.elasticbeanstalk" | Out-Null

    # package.json
    @"
{
  "name": "@rt/$($api.name)",
  "version": "1.0.0",
  "description": "$($api.description)",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "postinstall": "npm run build"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "@types/cors": "^2.8.17",
    "typescript": "^5.3.3"
  },
  "devDependencies": {
    "tsx": "^4.7.0"
  }
}
"@ | Out-File -FilePath "$apiPath/package.json" -Encoding UTF8

    # tsconfig.json
    @"
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
"@ | Out-File -FilePath "$apiPath/tsconfig.json" -Encoding UTF8

    # .gitignore
    @"
node_modules
dist
.env
*.log
eb-setenv.txt
.elasticbeanstalk/app_versions/
"@ | Out-File -FilePath "$apiPath/.gitignore" -Encoding UTF8

    # Procfile
    "web: npm start" | Out-File -FilePath "$apiPath/Procfile" -Encoding UTF8

    # .ebignore
    @"
node_modules
.git
.gitignore
*.md
src
tsconfig.json
.env
"@ | Out-File -FilePath "$apiPath/.ebignore" -Encoding UTF8

    Write-Host "  ✓ Structure créée" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  APIs créées avec succès!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Installer les dépendances: cd apps/api-[nom] && pnpm install" -ForegroundColor Cyan
Write-Host "2. Déployer sur EB: eb init && eb create" -ForegroundColor Cyan
