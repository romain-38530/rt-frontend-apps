#!/bin/bash

# Array of app IDs and names
declare -A apps
apps[d1tb834u144p4r]="web-transporter"
apps[d3b6p09ihn5w7r]="web-recipient"
apps[dzvo8973zaqb]="web-supplier"
apps[d3hz3xvddrl94o]="web-forwarder"
apps[dbg6okncuyyiw]="web-industry"

for app_id in "${!apps[@]}"; do
  app_name="${apps[$app_id]}"
  echo "Updating $app_name ($app_id)..."

  aws amplify update-app --app-id "$app_id" --build-spec "
version: 1
applications:
  - appRoot: apps/$app_name
    frontend:
      phases:
        preBuild:
          commands:
            - npm install -g pnpm@8.15.4
            - cd ../..
            - echo \"//npm.pkg.github.com/:_authToken=\$GITHUB_TOKEN\" >> .npmrc
            - pnpm install
            - cd packages/contracts && pnpm run build && cd ../..
            - cd packages/utils && pnpm run build && cd ../..
            - cd packages/ui-components && pnpm run build && cd ../..
            - cd apps/$app_name
        build:
          commands:
            - pnpm run build
            - rm -rf .next
            - echo '{\"version\":1,\"config\":{},\"appDir\":\"\",\"files\":[],\"ignore\":[]}' > out/required-server-files.json
      artifacts:
        baseDirectory: out
        files:
          - '**/*'
      cache:
        paths:
          - ../../node_modules/**/*
          - .next/cache/**/*
          - ../../.pnpm-store/**/*
" > /dev/null 2>&1 && echo "✅ $app_name updated" || echo "❌ $app_name failed"
done

echo ""
echo "✨ All buildSpecs updated!"
